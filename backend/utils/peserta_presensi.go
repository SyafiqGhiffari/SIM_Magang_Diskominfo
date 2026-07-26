package utils

import "gorm.io/gorm"

// PesertaPresensi adalah data peserta yang wajib presensi.
//
// Sumber utama daftar peserta = tabel user_manajemens (role "peserta",
// status_akun "aktif").
// Data pendaftaran hanya dipakai sebagai pelengkap:
//   - periode magang (tanggal_mulai / tanggal_selesai) sebagai batas kewajiban presensi
//   - EmailAktif  : email yang diisi peserta saat mengisi form pendaftaran,
//                   dipakai untuk notifikasi (pengingat presensi, dll)
type PesertaPresensi struct {
	PesertaID      uint    `json:"peserta_id"`
	Nama           string  `json:"nama"`
	EmailAkun      string  `json:"email_akun"`
	EmailAktif     string  `json:"email_aktif"`
	PendaftaranID  *uint   `json:"pendaftaran_id"`
	Kategori       string  `json:"kategori_pendaftar"`
	Bidang         string  `json:"posisi_bidang"`
	Institusi      string  `json:"institusi"`
	FotoProfil     string  `json:"foto_profil"`  
	FotoPeserta    string  `json:"foto_peserta"` 
	TanggalMulai   *string `json:"tanggal_mulai"`
	TanggalSelesai *string `json:"tanggal_selesai"`
	MentorID       *uint   `json:"mentor_id"`
}


// queryPesertaPresensi mengambil peserta aktif beserta data pendaftaran
// terakhirnya (jika ada).
const queryPesertaPresensi = `
SELECT
	u.id   AS peserta_id,
	u.nama AS nama,
	u.email AS email_akun,
	COALESCE(NULLIF(p.email, ''), up.email, u.email) AS email_aktif,
	p.id   AS pendaftaran_id,
	COALESCE(p.kategori_pendaftar, '') AS kategori,
	COALESCE(p.posisi_bidang, '')      AS bidang,
	COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
	COALESCE(u.foto_profil, '')   AS foto_profil,
	COALESCE(p.file_pas_foto, '') AS foto_peserta,
	p.tanggal_mulai,
	p.tanggal_selesai,
	p.mentor_id
FROM user_manajemens u
LEFT JOIN pendaftaran_magangs p
	ON p.id = (
		SELECT p2.id FROM pendaftaran_magangs p2
		WHERE p2.akun_peserta_id = u.id
		ORDER BY p2.id DESC LIMIT 1
	)
LEFT JOIN user_pendaftarans up ON up.id = p.user_pendaftaran_id
WHERE u.role = 'peserta' AND u.status_akun = 'aktif' AND u.status_magang = 'aktif'
`

// queryPesertaTermasukAlumni sama dengan queryPesertaPresensi tetapi TIDAK
// memfilter status_magang. Dipakai untuk rekap historis, karena alumni tetap
// perlu muncul pada periode saat mereka masih aktif magang.
const queryPesertaTermasukAlumni = `
SELECT
	u.id   AS peserta_id,
	u.nama AS nama,
	u.email AS email_akun,
	COALESCE(NULLIF(p.email, ''), up.email, u.email) AS email_aktif,
	p.id   AS pendaftaran_id,
	COALESCE(p.kategori_pendaftar, '') AS kategori,
	COALESCE(p.posisi_bidang, '')      AS bidang,
	COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
	p.tanggal_mulai,
	p.tanggal_selesai,
	p.mentor_id
FROM user_manajemens u
LEFT JOIN pendaftaran_magangs p
	ON p.id = (
		SELECT p2.id FROM pendaftaran_magangs p2
		WHERE p2.akun_peserta_id = u.id
		ORDER BY p2.id DESC LIMIT 1
	)
LEFT JOIN user_pendaftarans up ON up.id = p.user_pendaftaran_id
WHERE u.role = 'peserta' AND u.status_akun = 'aktif'
`

// AmbilPesertaPresensi mengembalikan peserta yang MASIH aktif magang
// (wajib presensi hari ini).
func AmbilPesertaPresensi(db *gorm.DB) ([]PesertaPresensi, error) {
	var hasil []PesertaPresensi
	err := db.Raw(queryPesertaPresensi).Scan(&hasil).Error
	return hasil, err
}

// AmbilPesertaPresensiTermasukAlumni dipakai untuk rekap/riwayat periode lampau.
func AmbilPesertaPresensiTermasukAlumni(db *gorm.DB) ([]PesertaPresensi, error) {
	var hasil []PesertaPresensi
	err := db.Raw(queryPesertaTermasukAlumni).Scan(&hasil).Error
	return hasil, err
}

// WajibPresensiPada mengecek apakah peserta ini wajib presensi pada tanggal
// tertentu. Jika periode magang tersedia, kewajiban dibatasi periode tersebut
// supaya peserta tidak dihitung alfa sebelum mulai atau setelah selesai magang.
func (p PesertaPresensi) WajibPresensiPada(tanggal string) bool {
	if p.TanggalMulai != nil && *p.TanggalMulai != "" && tanggal < normalisasiTanggal(*p.TanggalMulai) {
		return false
	}
	if p.TanggalSelesai != nil && *p.TanggalSelesai != "" && tanggal > normalisasiTanggal(*p.TanggalSelesai) {
		return false
	}
	return true
}

// normalisasiTanggal memotong nilai DATETIME dari driver MySQL menjadi
// "YYYY-MM-DD" agar bisa dibandingkan sebagai string.
func normalisasiTanggal(s string) string {
	if len(s) >= 10 {
		return s[:10]
	}
	return s
}

// EmailAktifPeserta mengembalikan email yang dipakai untuk mengirim notifikasi
// ke peserta, yaitu email dari form pendaftaran. Jika tidak ditemukan, jatuh
// kembali ke email akun manajemen.
func EmailAktifPeserta(db *gorm.DB, pesertaID uint) string {
	var email string
	db.Raw(`
		SELECT COALESCE(NULLIF(p.email, ''), up.email, u.email)
		FROM user_manajemens u
		LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id
		LEFT JOIN user_pendaftarans up ON up.id = p.user_pendaftaran_id
		WHERE u.id = ?
		ORDER BY p.id DESC LIMIT 1
	`, pesertaID).Scan(&email)
	return email
}
