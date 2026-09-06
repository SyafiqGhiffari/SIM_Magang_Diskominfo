package models

import "time"

// PenilaianMagang menyimpan hasil evaluasi dan penilaian akhir peserta magang
// yang diinput oleh mentor dan dikalkulasi secara otomatis oleh sistem.
type PenilaianMagang struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	PesertaID uint           `gorm:"index;uniqueIndex:idx_peserta_penilaian" json:"peserta_id"`
	Peserta   *UserManajemen `gorm:"foreignKey:PesertaID;constraint:OnDelete:CASCADE" json:"peserta,omitempty"`
	MentorID  uint           `gorm:"index" json:"mentor_id"`
	Mentor    *UserManajemen `gorm:"foreignKey:MentorID;constraint:OnDelete:SET NULL" json:"mentor,omitempty"`

	// Nilai rata-rata per pilar kompetensi (0 - 100)
	NilaiProfesional   float64 `gorm:"type:decimal(5,2);default:0.00" json:"nilai_profesional"`
	NilaiPersonal      float64 `gorm:"type:decimal(5,2);default:0.00" json:"nilai_personal"`
	NilaiSosial        float64 `gorm:"type:decimal(5,2);default:0.00" json:"nilai_sosial"`
	NilaiAdministratif float64 `gorm:"type:decimal(5,2);default:0.00" json:"nilai_administratif"`

	// Snapshot bobot yang digunakan saat penilaian (total = 100%)
	BobotProfesional   float64 `gorm:"type:decimal(5,2);default:35.00" json:"bobot_profesional"`
	BobotPersonal      float64 `gorm:"type:decimal(5,2);default:25.00" json:"bobot_personal"`
	BobotSosial        float64 `gorm:"type:decimal(5,2);default:20.00" json:"bobot_sosial"`
	BobotAdministratif float64 `gorm:"type:decimal(5,2);default:20.00" json:"bobot_administratif"`

	// Nilai Akhir Kumulatif, Indeks Huruf & Predikat
	NilaiAkhirAngka  float64 `gorm:"type:decimal(5,2);default:0.00" json:"nilai_akhir_angka"`
	IndeksNilaiAkhir string  `gorm:"type:varchar(5)" json:"indeks_nilai_akhir"` // A, A-, B+, B, B-, C+, C, D, E
	PredikatAkhir    string  `gorm:"type:varchar(50)" json:"predikat_akhir"`    // Sangat Baik, Baik, Cukup, Kurang

	CatatanMentor         string     `gorm:"type:text" json:"catatan_mentor"`
	LaporanAkhirDisetujui bool       `gorm:"default:false" json:"laporan_akhir_disetujui"`
	StatusPenilaian       string     `gorm:"type:varchar(20);default:'draf'" json:"status_penilaian"` // 'draf' | 'final'
	TanggalPenilaian      *time.Time `json:"tanggal_penilaian"`

	// Rincian skor butir per butir disimpan dalam bentuk JSON string
	DetailNilai string `gorm:"type:longtext" json:"detail_nilai"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PenilaianMagang) TableName() string {
	return "penilaian_magangs"
}
