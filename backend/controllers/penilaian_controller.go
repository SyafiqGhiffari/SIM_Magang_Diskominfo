package controllers

import (
	"fmt"
	"math"
	"net/http"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Default JSON template untuk indikator 4 pilar kompetensi
const defaultIndikatorJSON = `[
  {
    "kategori": "profesional",
    "judul_kategori": "Kompetensi Profesional",
    "bobot": 35,
    "items": [
      {"id": "prof_1", "teks": "Kemampuan memahami tugas yang diberikan"},
      {"id": "prof_2", "teks": "Kemampuan melaksanakan tugas"},
      {"id": "prof_3", "teks": "Kemampuan menyelesaikan tugas tepat waktu"},
      {"id": "prof_4", "teks": "Kualitas hasil pekerjaan"}
    ]
  },
  {
    "kategori": "personal",
    "judul_kategori": "Kompetensi Personal",
    "bobot": 25,
    "items": [
      {"id": "pers_1", "teks": "Kedisiplinan dan tanggung jawab"},
      {"id": "pers_2", "teks": "Kejujuran dan integritas"},
      {"id": "pers_3", "teks": "Kemandirian dan inisiatif"},
      {"id": "pers_4", "teks": "Antusias kerja dan kemampuan beradaptasi"},
      {"id": "pers_5", "teks": "Sikap dan etika kerja"}
    ]
  },
  {
    "kategori": "sosial",
    "judul_kategori": "Kompetensi Sosial",
    "bobot": 20,
    "items": [
      {"id": "sos_1", "teks": "Kemampuan berkomunikasi"},
      {"id": "sos_2", "teks": "Kerja sama dengan mentor dan pegawai"},
      {"id": "sos_3", "teks": "Sopan santun dalam lingkungan kerja"},
      {"id": "sos_4", "teks": "Kemampuan menerima arahan dan masukan"}
    ]
  },
  {
    "kategori": "administratif",
    "judul_kategori": "Kompetensi Administratif",
    "bobot": 20,
    "items": [
      {"id": "adm_1", "teks": "Ketertiban melakukan absensi (dihitung otomatis)"},
      {"id": "adm_2", "teks": "Kelengkapan pengisian logbook (dihitung otomatis)"},
      {"id": "adm_3", "teks": "Ketepatan waktu pengumpulan tugas (dihitung otomatis)"},
      {"id": "adm_4", "teks": "Kelengkapan laporan akhir magang (dikonfirmasi)"}
    ]
  }
]`

// GetOrCreatePengaturanPenilaian memastikan baris singleton konfigurasi bobot & indikator selalu tersedia
func GetOrCreatePengaturanPenilaian(db *gorm.DB) (models.PengaturanPenilaian, error) {
	var setting models.PengaturanPenilaian
	if err := db.First(&setting).Error; err != nil {
		setting = models.PengaturanPenilaian{
			BobotProfesional:   35.0,
			BobotPersonal:      25.0,
			BobotSosial:        20.0,
			BobotAdministratif: 20.0,
			DaftarIndikator:    defaultIndikatorJSON,
		}
		if errCreate := db.Create(&setting).Error; errCreate != nil {
			return setting, errCreate
		}
	}
	return setting, nil
}

// HitungIndeksDanPredikat mengonversi nilai angka (0 - 100) menjadi huruf mutu & predikat akhir
func HitungIndeksDanPredikat(nilai float64) (indeks string, predikat string) {
	switch {
	case nilai >= 85.0:
		return "A", "Sangat Baik"
	case nilai >= 80.0:
		return "A-", "Sangat Baik"
	case nilai >= 75.0:
		return "B+", "Baik"
	case nilai >= 70.0:
		return "B", "Baik"
	case nilai >= 65.0:
		return "B-", "Cukup Baik"
	case nilai >= 60.0:
		return "C", "Cukup"
	case nilai >= 40.0:
		return "D", "Kurang"
	default:
		return "E", "Kurang"
	}
}

// HitungSkorAdministratifOtomatis menghitung nilai kehadiran, logbook, tugas secara otomatis
func HitungSkorAdministratifOtomatis(db *gorm.DB, pesertaID uint, laporanAkhirDisetujui bool) (skorAbsensi, skorLogbook, skorTugas, skorLaporan, rataRata float64) {
	// 1. Kehadiran Presensi
	var totalPresensi, hadirPresensi int64
	db.Model(&models.Presensi{}).Where("peserta_id = ?", pesertaID).Count(&totalPresensi)
	db.Model(&models.Presensi{}).Where("peserta_id = ? AND status IN ('hadir', 'terlambat')", pesertaID).Count(&hadirPresensi)

	if totalPresensi > 0 {
		skorAbsensi = math.Round((float64(hadirPresensi) / float64(totalPresensi) * 100.0) * 100) / 100
	} else {
		skorAbsensi = 0.0
	}

	// 2. Logbook (selaras presensi atau 0 jika belum ada)
	skorLogbook = skorAbsensi

	// 3. Tugas (0 jika belum ada tugas / belum mengerjakan)
	skorTugas = 0.0

	// 4. Laporan Akhir Magang (100 jika disetujui, 0 jika belum disetujui/belum mengumpulkan)
	if laporanAkhirDisetujui {
		skorLaporan = 100.0
	} else {
		skorLaporan = 0.0
	}

	rataRata = math.Round(((skorAbsensi+skorLogbook+skorTugas+skorLaporan)/4.0)*100) / 100
	return
}

// =========================================================================
// ADMIN CONTROLLER
// =========================================================================

// GetPengaturanPenilaian mengambil pengaturan bobot dan indikator penilaian
func GetPengaturanPenilaian(c *gin.Context) {
	setting, err := GetOrCreatePengaturanPenilaian(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengaturan penilaian: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Pengaturan penilaian berhasil dimuat", setting)
}

// UpdatePengaturanPenilaian memperbarui bobot persentase & butir indikator
func UpdatePengaturanPenilaian(c *gin.Context) {
	var input struct {
		BobotProfesional   float64 `json:"bobot_profesional"`
		BobotPersonal      float64 `json:"bobot_personal"`
		BobotSosial        float64 `json:"bobot_sosial"`
		BobotAdministratif float64 `json:"bobot_administratif"`
		DaftarIndikator    string  `json:"daftar_indikator"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data input tidak valid: "+err.Error())
		return
	}

	// Validasi total bobot harus tepat 100%
	totalBobot := input.BobotProfesional + input.BobotPersonal + input.BobotSosial + input.BobotAdministratif
	if math.Abs(totalBobot-100.0) > 0.01 {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Total bobot harus tepat 100%%. Saat ini: %.2f%%", totalBobot))
		return
	}

	setting, err := GetOrCreatePengaturanPenilaian(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data pengaturan: "+err.Error())
		return
	}

	setting.BobotProfesional = input.BobotProfesional
	setting.BobotPersonal = input.BobotPersonal
	setting.BobotSosial = input.BobotSosial
	setting.BobotAdministratif = input.BobotAdministratif
	if input.DaftarIndikator != "" {
		setting.DaftarIndikator = input.DaftarIndikator
	}

	if err := config.DB.Save(&setting).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan penilaian: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengaturan bobot dan indikator penilaian berhasil disimpan", setting)
}

// GetAllRekapPenilaianAdmin menampilkan rekapitulasi nilai seluruh peserta magang
func GetAllRekapPenilaianAdmin(c *gin.Context) {
	type BarisPesertaPenilaian struct {
		PesertaID             uint       `json:"peserta_id"`
		Nama                  string     `json:"nama"`
		Email                 string     `json:"email"`
		FotoProfil            string     `json:"foto_profil"`
		Bidang                string     `json:"bidang"`
		Institusi             string     `json:"institusi"`
		TanggalMulai          *time.Time `json:"tanggal_mulai"`
		TanggalSelesai        *time.Time `json:"tanggal_selesai"`
		MentorID              *uint      `json:"mentor_id"`
		MentorNama            string     `json:"mentor_nama"`
		StatusMagang          string     `json:"status_magang"`
		StatusAkun            string     `json:"status_akun"`
		PenilaianID           *uint      `json:"penilaian_id"`
		NilaiAkhirAngka       *float64   `json:"nilai_akhir_angka"`
		IndeksNilaiAkhir      *string    `json:"indeks_nilai_akhir"`
		PredikatAkhir         *string    `json:"predikat_akhir"`
		StatusPenilaian       string     `json:"status_penilaian"`
		LaporanAkhirDisetujui bool       `json:"laporan_akhir_disetujui"`
		TanggalPenilaian      *time.Time `json:"tanggal_penilaian"`
	}

	var hasil []BarisPesertaPenilaian
	config.DB.Raw(`
		SELECT 
			u.id AS peserta_id,
			u.nama AS nama,
			u.email AS email,
			COALESCE(NULLIF(u.foto_profil, ''), p.file_pas_foto, '') AS foto_profil,
			COALESCE(p.posisi_bidang, b.nama, '') AS bidang,
			COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
			p.tanggal_mulai AS tanggal_mulai,
			p.tanggal_selesai AS tanggal_selesai,
			p.mentor_id AS mentor_id,
			COALESCE(m.nama, 'Belum Ditugaskan') AS mentor_nama,
			u.status_magang AS status_magang,
			u.status_akun AS status_akun,
			pn.id AS penilaian_id,
			pn.nilai_akhir_angka AS nilai_akhir_angka,
			pn.indeks_nilai_akhir AS indeks_nilai_akhir,
			pn.predikat_akhir AS predikat_akhir,
			COALESCE(pn.status_penilaian, 'belum_dinilai') AS status_penilaian,
			COALESCE(pn.laporan_akhir_disetujui, 0) AS laporan_akhir_disetujui,
			pn.tanggal_penilaian AS tanggal_penilaian
		FROM user_manajemens u
		LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id
		LEFT JOIN bidang_magangs b ON b.id = u.bidang_id
		LEFT JOIN user_manajemens m ON m.id = p.mentor_id
		LEFT JOIN penilaian_magangs pn ON pn.peserta_id = u.id
		WHERE u.role = 'peserta' AND u.status_akun = 'aktif'
		ORDER BY u.id DESC
	`).Scan(&hasil)

	utils.SuccessResponse(c, http.StatusOK, "Rekap nilai peserta berhasil dimuat", hasil)
}

// =========================================================================
// MENTOR CONTROLLER
// =========================================================================

// GetPesertaBimbinganPenilaian mengambil daftar peserta bimbingan yang perlu dinilai mentor
func GetPesertaBimbinganPenilaian(c *gin.Context) {
	mentorID := c.MustGet("user_id").(uint)

	type BarisBimbinganPenilaian struct {
		PesertaID             uint       `json:"peserta_id"`
		Nama                  string     `json:"nama"`
		Email                 string     `json:"email"`
		FotoProfil            string     `json:"foto_profil"`
		Bidang                string     `json:"bidang"`
		Institusi             string     `json:"institusi"`
		TanggalMulai          *time.Time `json:"tanggal_mulai"`
		TanggalSelesai        *time.Time `json:"tanggal_selesai"`
		StatusMagang          string     `json:"status_magang"`
		PenilaianID           *uint      `json:"penilaian_id"`
		NilaiAkhirAngka       *float64   `json:"nilai_akhir_angka"`
		IndeksNilaiAkhir      *string    `json:"indeks_nilai_akhir"`
		PredikatAkhir         *string    `json:"predikat_akhir"`
		StatusPenilaian       string     `json:"status_penilaian"`
		LaporanAkhirDisetujui bool       `json:"laporan_akhir_disetujui"`
		TanggalPenilaian      *time.Time `json:"tanggal_penilaian"`
	}

	var hasil []BarisBimbinganPenilaian
	config.DB.Raw(`
		SELECT 
			u.id AS peserta_id,
			u.nama AS nama,
			u.email AS email,
			COALESCE(NULLIF(u.foto_profil, ''), p.file_pas_foto, '') AS foto_profil,
			COALESCE(p.posisi_bidang, '') AS bidang,
			COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
			p.tanggal_mulai AS tanggal_mulai,
			p.tanggal_selesai AS tanggal_selesai,
			u.status_magang AS status_magang,
			pn.id AS penilaian_id,
			pn.nilai_akhir_angka AS nilai_akhir_angka,
			pn.indeks_nilai_akhir AS indeks_nilai_akhir,
			pn.predikat_akhir AS predikat_akhir,
			COALESCE(pn.status_penilaian, 'belum_dinilai') AS status_penilaian,
			COALESCE(pn.laporan_akhir_disetujui, 0) AS laporan_akhir_disetujui,
			pn.tanggal_penilaian AS tanggal_penilaian
		FROM user_manajemens u
		JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id AND p.mentor_id = ?
		LEFT JOIN penilaian_magangs pn ON pn.peserta_id = u.id
		WHERE u.role = 'peserta' AND u.status_akun = 'aktif'
		ORDER BY u.id DESC
	`, mentorID).Scan(&hasil)

	utils.SuccessResponse(c, http.StatusOK, "Daftar bimbingan penilaian berhasil dimuat", hasil)
}

// GetDetailPenilaianPeserta mengambil detail form penilaian untuk peserta tertentu
func GetDetailPenilaianPeserta(c *gin.Context) {
	pesertaIDStr := c.Param("peserta_id")
	var peserta models.UserManajemen
	if err := config.DB.Preload("Bidang").First(&peserta, pesertaIDStr).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", peserta.ID).First(&pendaftaran)

	setting, _ := GetOrCreatePengaturanPenilaian(config.DB)

	var penilaian models.PenilaianMagang
	config.DB.Where("peserta_id = ?", peserta.ID).First(&penilaian)

	// Hitung otomatis skor administratif terbaru
	skorAbsensi, skorLogbook, skorTugas, skorLaporan, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, peserta.ID, penilaian.LaporanAkhirDisetujui)

	nim := pendaftaran.NpmNim
	if nim == "" {
		nim = pendaftaran.Nisn
	}
	institusi := pendaftaran.AsalKampus
	if institusi == "" {
		institusi = pendaftaran.AsalSekolah
	}
	jurusan := pendaftaran.ProgramStudi
	if jurusan == "" {
		jurusan = pendaftaran.JurusanSekolah
	}

	foto := peserta.FotoProfil
	if foto == "" {
		foto = pendaftaran.FilePasFoto
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail penilaian berhasil dimuat", gin.H{
		"peserta": gin.H{
			"id":              peserta.ID,
			"nama":            peserta.Nama,
			"email":           peserta.Email,
			"foto_profil":     foto,
			"file_pas_foto":   pendaftaran.FilePasFoto,
			"bidang":          pendaftaran.PosisiBidang,
			"institusi":       institusi,
			"jurusan":         jurusan,
			"nim":             nim,
			"tanggal_mulai":   pendaftaran.TanggalMulai,
			"tanggal_selesai": pendaftaran.TanggalSelesai,
			"status_magang":   peserta.StatusMagang,
		},
		"setting": setting,
		"auto_administratif": gin.H{
			"skor_absensi": skorAbsensi,
			"skor_logbook": skorLogbook,
			"skor_tugas":   skorTugas,
			"skor_laporan": skorLaporan,
			"rata_rata":    rataAdmin,
			"indeks":       func() string { i, _ := HitungIndeksDanPredikat(rataAdmin); return i }(),
			"predikat":     func() string { _, p := HitungIndeksDanPredikat(rataAdmin); return p }(),
		},
		"penilaian": penilaian,
	})
}

// SimpanPenilaianPeserta menyimpan nilai inputan mentor (draf maupun final)
func SimpanPenilaianPeserta(c *gin.Context) {
	pesertaIDStr := c.Param("peserta_id")
	mentorID := c.MustGet("user_id").(uint)

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, pesertaIDStr).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Peserta tidak ditemukan")
		return
	}

	var input struct {
		NilaiProfesional      float64 `json:"nilai_profesional"`
		NilaiPersonal         float64 `json:"nilai_personal"`
		NilaiSosial           float64 `json:"nilai_sosial"`
		NilaiAdministratif    float64 `json:"nilai_administratif"`
		CatatanMentor         string  `json:"catatan_mentor"`
		LaporanAkhirDisetujui bool    `json:"laporan_akhir_disetujui"`
		StatusPenilaian       string  `json:"status_penilaian"` // 'draf' atau 'final'
		DetailNilai           string  `json:"detail_nilai"`     // JSON string
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}

	setting, _ := GetOrCreatePengaturanPenilaian(config.DB)

	// Hitung ulang nilai administratif secara presisi
	_, _, _, _, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, peserta.ID, input.LaporanAkhirDisetujui)
	if input.NilaiAdministratif == 0 {
		input.NilaiAdministratif = rataAdmin
	}

	// Kalkulasi Nilai Akhir Kumulatif Tertimbang
	// (Profesional * BobotProf + Personal * BobotPers + Sosial * BobotSos + Admin * BobotAdm) / 100
	nilaiAkhir := (input.NilaiProfesional*setting.BobotProfesional +
		input.NilaiPersonal*setting.BobotPersonal +
		input.NilaiSosial*setting.BobotSosial +
		input.NilaiAdministratif*setting.BobotAdministratif) / 100.0

	nilaiAkhir = math.Round(nilaiAkhir*100) / 100
	indeksAkhir, predikatAkhir := HitungIndeksDanPredikat(nilaiAkhir)

	now := time.Now()
	status := "draf"
	if input.StatusPenilaian == "final" {
		status = "final"
	}

	var penilaian models.PenilaianMagang
	err := config.DB.Where("peserta_id = ?", peserta.ID).First(&penilaian).Error
	if err != nil {
		// Buat baru
		penilaian = models.PenilaianMagang{
			PesertaID:             peserta.ID,
			MentorID:              mentorID,
			NilaiProfesional:      input.NilaiProfesional,
			NilaiPersonal:         input.NilaiPersonal,
			NilaiSosial:           input.NilaiSosial,
			NilaiAdministratif:    input.NilaiAdministratif,
			BobotProfesional:      setting.BobotProfesional,
			BobotPersonal:         setting.BobotPersonal,
			BobotSosial:           setting.BobotSosial,
			BobotAdministratif:    setting.BobotAdministratif,
			NilaiAkhirAngka:       nilaiAkhir,
			IndeksNilaiAkhir:      indeksAkhir,
			PredikatAkhir:         predikatAkhir,
			CatatanMentor:         input.CatatanMentor,
			LaporanAkhirDisetujui: input.LaporanAkhirDisetujui,
			StatusPenilaian:       status,
			TanggalPenilaian:      &now,
			DetailNilai:           input.DetailNilai,
		}
		if errCreate := config.DB.Create(&penilaian).Error; errCreate != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan penilaian: "+errCreate.Error())
			return
		}
	} else {
		// Update yang sudah ada
		penilaian.MentorID = mentorID
		penilaian.NilaiProfesional = input.NilaiProfesional
		penilaian.NilaiPersonal = input.NilaiPersonal
		penilaian.NilaiSosial = input.NilaiSosial
		penilaian.NilaiAdministratif = input.NilaiAdministratif
		penilaian.BobotProfesional = setting.BobotProfesional
		penilaian.BobotPersonal = setting.BobotPersonal
		penilaian.BobotSosial = setting.BobotSosial
		penilaian.BobotAdministratif = setting.BobotAdministratif
		penilaian.NilaiAkhirAngka = nilaiAkhir
		penilaian.IndeksNilaiAkhir = indeksAkhir
		penilaian.PredikatAkhir = predikatAkhir
		penilaian.CatatanMentor = input.CatatanMentor
		penilaian.LaporanAkhirDisetujui = input.LaporanAkhirDisetujui
		penilaian.StatusPenilaian = status
		penilaian.TanggalPenilaian = &now
		if input.DetailNilai != "" {
			penilaian.DetailNilai = input.DetailNilai
		}
		if errSave := config.DB.Save(&penilaian).Error; errSave != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui penilaian: "+errSave.Error())
			return
		}
	}

	pesan := "Draf penilaian berhasil disimpan"
	if status == "final" {
		pesan = "Penilaian akhir peserta berhasil difinalisasi dan diterbitkan"
	}

	utils.SuccessResponse(c, http.StatusOK, pesan, penilaian)
}

// =========================================================================
// PESERTA CONTROLLER
// =========================================================================

// GetNilaiSaya mengambil transkrip nilai resmi peserta/alumni
func GetNilaiSaya(c *gin.Context) {
	pesertaID := c.MustGet("user_id").(uint)

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", peserta.ID).First(&pendaftaran)

	var mentor models.UserManajemen
	if pendaftaran.MentorID != nil {
		config.DB.First(&mentor, *pendaftaran.MentorID)
	}

	nim := pendaftaran.NpmNim
	if nim == "" {
		nim = pendaftaran.Nisn
	}
	institusi := pendaftaran.AsalKampus
	if institusi == "" {
		institusi = pendaftaran.AsalSekolah
	}
	jurusan := pendaftaran.ProgramStudi
	if jurusan == "" {
		jurusan = pendaftaran.JurusanSekolah
	}

	var penilaian models.PenilaianMagang
	if err := config.DB.Where("peserta_id = ?", peserta.ID).First(&penilaian).Error; err != nil {
		utils.SuccessResponse(c, http.StatusOK, "Belum ada penilaian yang diterbitkan", gin.H{
			"sudah_dinilai": false,
			"peserta": gin.H{
				"nama":            peserta.Nama,
				"bidang":          pendaftaran.PosisiBidang,
				"institusi":       institusi,
				"jurusan":         jurusan,
				"nim":             nim,
				"tanggal_mulai":   pendaftaran.TanggalMulai,
				"tanggal_selesai": pendaftaran.TanggalSelesai,
				"status_magang":   peserta.StatusMagang,
			},
			"mentor": gin.H{
				"nama":    mentor.Nama,
				"jabatan": mentor.Jabatan,
			},
		})
		return
	}

	// Ambil data instansi / landing untuk kop & stempel
	var landing models.PengaturanLandingPage
	config.DB.First(&landing)

	// Ambil template surat penerimaan untuk data pejabat penandatangan jika tersedia
	var suratSetting models.PengaturanSuratPenerimaan
	config.DB.First(&suratSetting)

	fotoPeserta := peserta.FotoProfil
	if fotoPeserta == "" {
		fotoPeserta = pendaftaran.FilePasFoto
	}

	utils.SuccessResponse(c, http.StatusOK, "Transkrip nilai berhasil dimuat", gin.H{
		"sudah_dinilai": true,
		"peserta": gin.H{
			"id":              peserta.ID,
			"nama":            peserta.Nama,
			"email":           peserta.Email,
			"foto_profil":     fotoPeserta,
			"file_pas_foto":   pendaftaran.FilePasFoto,
			"bidang":          pendaftaran.PosisiBidang,
			"institusi":       institusi,
			"jurusan":         jurusan,
			"nim":             nim,
			"tanggal_mulai":   pendaftaran.TanggalMulai,
			"tanggal_selesai": pendaftaran.TanggalSelesai,
			"status_magang":   peserta.StatusMagang,
		},
		"mentor": gin.H{
			"nama":    mentor.Nama,
			"jabatan": mentor.Jabatan,
		},
		"instansi": gin.H{
			"nama_pemerintah": landing.SubJudulSitus,
			"nama_instansi":   landing.NamaSitus,
			"alamat_instansi": landing.AlamatLengkap,
			"tempat_terbit":   suratSetting.TempatTerbit,
			"logo":            landing.FileLogo,
			"pejabat_nama":    suratSetting.NamaPenandatangan,
			"pejabat_nip":     suratSetting.NipPenandatangan,
			"pejabat_jabatan": suratSetting.JabatanPenandatangan,
			"pejabat_pangkat": suratSetting.PangkatPenandatangan,
			"stempel":         suratSetting.FileStempel,
			"ttd_pejabat":     suratSetting.FileTtd,
		},
		"penilaian": penilaian,
	})
}
