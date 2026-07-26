package models

import "time"

// Presensi menyimpan kehadiran harian peserta magang.
// Aturan: 1 baris = 1 peserta x 1 tanggal (dijaga unique index).
//
// Alur status:
//   - absen masuk <= jam_masuk + toleransi          -> "hadir"
//   - absen masuk >  jam_masuk + toleransi           -> "terlambat"
//     (tetap bisa absen sampai pukul 23:59 hari itu; jika sudah melewati
//      jam pulang, LupaPresensi = true)
//   - tidak absen sampai hari berganti               -> "alfa" (dibuat sistem)
//   - izin/sakit hanya dibuat dari PengajuanIzin yang disetujui mentor
type Presensi struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Peserta = akun user_manajemens dengan role "peserta"
	PesertaID uint          `gorm:"not null;uniqueIndex:idx_presensi_peserta_tanggal" json:"peserta_id"`
	Peserta   UserManajemen `gorm:"foreignKey:PesertaID" json:"peserta,omitempty"`

	// Snapshot pendaftaran (untuk rekap per bidang/institusi/periode)
	PendaftaranID *uint              `gorm:"index" json:"pendaftaran_id"`
	Pendaftaran   *PendaftaranMagang `gorm:"foreignKey:PendaftaranID" json:"pendaftaran,omitempty"`

	Tanggal string `gorm:"type:date;not null;uniqueIndex:idx_presensi_peserta_tanggal;index" json:"tanggal"` // YYYY-MM-DD

	JamMasuk  *string `gorm:"type:varchar(5)" json:"jam_masuk"`  // "HH:MM"
	JamPulang *string `gorm:"type:varchar(5)" json:"jam_pulang"` // "HH:MM"

	Status         string `gorm:"type:enum('hadir','terlambat','izin','sakit','alfa');not null;index" json:"status"`
	MenitTerlambat int    `gorm:"default:0" json:"menit_terlambat"`

	// true = absen dilakukan setelah jam pulang (kasus peserta lupa presensi)
	LupaPresensi bool `gorm:"default:false" json:"lupa_presensi"`

	// Dikunci = hari sudah ditutup sistem, peserta tidak bisa mengisi/mengubah lagi
	Dikunci     bool       `gorm:"default:false" json:"dikunci"`
	DikunciPada *time.Time `json:"dikunci_pada"`

	Keterangan string `gorm:"type:text" json:"keterangan"`
	FotoMasuk  string `gorm:"type:varchar(255)" json:"foto_masuk"`
	FotoPulang string `gorm:"type:varchar(255)" json:"foto_pulang"`

	// Sumber pencatatan: "peserta" (absen sendiri), "mentor" (koreksi),
	// "sistem" (alfa otomatis / hasil persetujuan izin)
	Sumber        string         `gorm:"type:enum('peserta','mentor','admin','sistem');default:'peserta'" json:"sumber"`
	DicatatOlehID *uint          `json:"dicatat_oleh_id"`
	DicatatOleh   *UserManajemen `gorm:"foreignKey:DicatatOlehID" json:"dicatat_oleh,omitempty"`

	// Referensi pengajuan izin bila status izin/sakit
	PengajuanIzinID *uint `json:"pengajuan_izin_id"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Presensi) TableName() string {
	return "presensis"
}

// PenutupanPresensi mencatat tanggal yang sudah ditutup oleh sistem
// (alfa otomatis sudah dibuat). Dipakai agar proses penutupan idempoten
// dan murah: tidak perlu memindai ulang seluruh riwayat presensi.
type PenutupanPresensi struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Tanggal    string    `gorm:"type:date;unique;not null" json:"tanggal"`
	HariKerja  bool      `gorm:"default:true" json:"hari_kerja"`
	JumlahAlfa int       `gorm:"default:0" json:"jumlah_alfa"`
	CreatedAt  time.Time `json:"created_at"`
}

func (PenutupanPresensi) TableName() string {
	return "penutupan_presensis"
}