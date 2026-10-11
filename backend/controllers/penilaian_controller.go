// ==============================================================================
// CONTROLLER: PENILAIAN CONTROLLER
// DESKRIPSI : Pengelolaan evaluasi akhir magang berbasis 4 pilar kompetensi
//             (profesional, personal, sosial, administratif), perhitungan otomatis
//             skor administratif (presensi, logbook, tugas, laporan akhir),
//             penerbitan rapor nilai oleh mentor, transkrip nilai peserta, serta
//             manajemen template rapor kedinasan oleh admin.
// ROLE TERKAIT: [ROLE: ADMIN], [ROLE: MENTOR], [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"fmt"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
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
	case nilai >= 70.0:
		return "B", "Baik"
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
	// 1. Kehadiran Presensi (Hadir: 100, Terlambat: 75, Izin/Sakit: 50, Alfa: 0)
	type PresensiRekapStatus struct {
		Status string
		Jumlah int64
	}
	var rekapPresensi []PresensiRekapStatus
	db.Model(&models.Presensi{}).
		Select("status, COUNT(id) as jumlah").
		Where("peserta_id = ?", pesertaID).
		Group("status").
		Scan(&rekapPresensi)

	var totalPresensi int64
	var totalPoinPresensi float64
	for _, r := range rekapPresensi {
		totalPresensi += r.Jumlah
		switch r.Status {
		case "hadir":
			totalPoinPresensi += float64(r.Jumlah) * 100.0
		case "terlambat":
			totalPoinPresensi += float64(r.Jumlah) * 75.0
		case "izin", "sakit":
			totalPoinPresensi += float64(r.Jumlah) * 50.0
		case "alfa":
			totalPoinPresensi += float64(r.Jumlah) * 0.0
		}
	}

	if totalPresensi > 0 {
		skorAbsensi = math.Round((totalPoinPresensi / float64(totalPresensi)) * 100) / 100
	} else {
		skorAbsensi = 0.0
	}

	// 2. Logbook Harian (dihitung dari catatan logbook hari hadir yang valid)
	var terisiLogbook int64
	db.Model(&models.Presensi{}).
		Where("peserta_id = ? AND status IN ('hadir', 'terlambat') AND keterangan IS NOT NULL AND TRIM(keterangan) != '' AND keterangan != 'Tidak melakukan presensi'", pesertaID).
		Count(&terisiLogbook)

	if totalPresensi > 0 {
		skorLogbook = math.Round((float64(terisiLogbook) / float64(totalPresensi) * 100.0) * 100) / 100
	} else {
		skorLogbook = 0.0
	}

	// 3. Tugas (Dihitung dari ketepatan waktu & nilai pengumpulan tugas yang relevan)
	var pendaftaran models.PendaftaranMagang
	db.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran)

	var tugasList []models.TugasMagang
	qTugas := db.Model(&models.TugasMagang{})
	if pendaftaran.MentorID != nil {
		jenjang := strings.ToLower(pendaftaran.KategoriPendaftar)
		qTugas = qTugas.Where(
			"(mentor_id IS NULL OR mentor_id = ?) AND ("+
				"(target_peserta = 'semua_bimbingan' AND (target_jenjang = 'semua' OR target_jenjang = ? OR target_jenjang IS NULL OR target_jenjang = '')) OR "+
				"(target_peserta = 'mahasiswa' AND ? = 'mahasiswa') OR "+
				"(target_peserta = 'siswa' AND ? = 'siswa') OR "+
				"id IN (SELECT tugas_id FROM tugas_peserta_akses WHERE peserta_id = ?) OR "+
				"peserta_id = ? OR "+
				"(peserta_id IS NULL AND (target_peserta = '' OR target_peserta IS NULL))"+
				")",
			*pendaftaran.MentorID, jenjang, jenjang, jenjang, pesertaID, pesertaID,
		)
	} else if pendaftaran.PosisiBidang != "" {
		qTugas = qTugas.Where("(posisi_bidang = 'semua' OR posisi_bidang = ?) AND (peserta_id IS NULL OR peserta_id = ?)", pendaftaran.PosisiBidang, pesertaID)
	} else {
		qTugas = qTugas.Where("peserta_id IS NULL OR peserta_id = ?", pesertaID)
	}
	qTugas.Find(&tugasList)

	var pengumpulanList []models.PengumpulanTugas
	db.Where("peserta_id = ?", pesertaID).Find(&pengumpulanList)
	mapPengumpulan := make(map[uint]models.PengumpulanTugas)
	for _, p := range pengumpulanList {
		mapPengumpulan[p.TugasID] = p
	}

	if len(tugasList) > 0 {
		var totalNilaiTugas float64
		for _, t := range tugasList {
			if p, ada := mapPengumpulan[t.ID]; ada {
				switch p.Status {
				case "dinilai":
					if p.Nilai != nil {
						totalNilaiTugas += *p.Nilai
					} else {
						totalNilaiTugas += 100.0
					}
				case "menunggu":
					totalNilaiTugas += 85.0
				case "revisi":
					totalNilaiTugas += 50.0
				}
			}
		}
		skorTugas = math.Round((totalNilaiTugas / float64(len(tugasList))) * 100) / 100
	} else if len(pengumpulanList) > 0 {
		var totalNilaiTugas float64
		var countDinilai int
		for _, p := range pengumpulanList {
			switch p.Status {
			case "dinilai":
				if p.Nilai != nil {
					totalNilaiTugas += *p.Nilai
				} else {
					totalNilaiTugas += 100.0
				}
				countDinilai++
			case "menunggu":
				totalNilaiTugas += 85.0
				countDinilai++
			}
		}
		if countDinilai > 0 {
			skorTugas = math.Round((totalNilaiTugas / float64(countDinilai)) * 100) / 100
		} else {
			skorTugas = 80.0
		}
	} else {
		skorTugas = 100.0
	}

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

// [ROLE: ADMIN]
// GetPengaturanPenilaian mengambil konfigurasi bobot persentase 4 pilar kompetensi dan daftar butir indikator evaluasi magang.
// Endpoint: GET /api/manajemen/admin/pengaturan-penilaian
func GetPengaturanPenilaian(c *gin.Context) {
	setting, err := GetOrCreatePengaturanPenilaian(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengaturan penilaian: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Pengaturan penilaian berhasil dimuat", setting)
}

// [ROLE: ADMIN]
// UpdatePengaturanPenilaian memperbarui persentase bobot 4 pilar kompetensi (total wajib 100%) dan konfigurasi butir indikator penilaian.
// Endpoint: PUT /api/manajemen/admin/pengaturan-penilaian
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

// [ROLE: ADMIN]
// GetAllRekapPenilaianAdmin menampilkan rekapitulasi penilaian seluruh peserta magang aktif beserta indeks nilai dan status rapor.
// Endpoint: GET /api/manajemen/admin/penilaian
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

// [ROLE: MENTOR]
// GetPesertaBimbinganPenilaian mengambil daftar peserta bimbingan yang perlu dinilai oleh mentor login, dilengkapi data kehadiran, logbook, dan laporan akhir.
// Endpoint: GET /api/manajemen/mentor/penilaian
func GetPesertaBimbinganPenilaian(c *gin.Context) {
	mentorID, ok := getUserIDFromContext(c)
	if !ok || mentorID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	type BarisBimbinganPenilaian struct {
		PesertaID             uint       `json:"peserta_id"`
		Nama                  string     `json:"nama"`
		Email                 string     `json:"email"`
		FotoProfil            string     `json:"foto_profil"`
		Bidang                string     `json:"bidang"`
		Institusi             string     `json:"institusi"`
		Nim                   string     `json:"nim"`
		Jurusan               string     `json:"jurusan"`
		KategoriPendaftar     string     `json:"kategori_pendaftar"`
		StatusLaporanAkhir    string     `json:"status_laporan_akhir"`
		FileLaporanAkhir      string     `json:"file_laporan_akhir"`
		TanggalMulai          *time.Time `json:"tanggal_mulai"`
		TanggalSelesai        *time.Time `json:"tanggal_selesai"`
		StatusMagang          string     `json:"status_magang"`
		PenilaianID           *uint      `json:"penilaian_id"`
		NilaiProfesional      *float64   `json:"nilai_profesional"`
		NilaiPersonal         *float64   `json:"nilai_personal"`
		NilaiSosial           *float64   `json:"nilai_sosial"`
		NilaiAdministratif    *float64   `json:"nilai_administratif"`
		NilaiAkhirAngka       *float64   `json:"nilai_akhir_angka"`
		IndeksNilaiAkhir      *string    `json:"indeks_nilai_akhir"`
		PredikatAkhir         *string    `json:"predikat_akhir"`
		StatusPenilaian       string     `json:"status_penilaian"`
		LaporanAkhirDisetujui bool       `json:"laporan_akhir_disetujui"`
		TanggalPenilaian      *time.Time `json:"tanggal_penilaian"`
		TotalPresensi         int        `json:"total_presensi"`
		HadirPresensi         int        `json:"hadir_presensi"`
		TotalPoinPresensi     float64    `json:"total_poin_presensi"`
		PersenPresensi        float64    `json:"persen_presensi"`
		TotalLogbook          int        `json:"total_logbook"`
		TerisiLogbook         int        `json:"terisi_logbook"`
		AccLogbook            int        `json:"acc_logbook,omitempty"`
		PersenLogbook         float64    `json:"persen_logbook"`
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
			COALESCE(NULLIF(p.npm_nim, ''), p.nisn, '-') AS nim,
			COALESCE(NULLIF(p.program_studi, ''), p.jurusan_sekolah, '-') AS jurusan,
			COALESCE(p.kategori_pendaftar, 'mahasiswa') AS kategori_pendaftar,
			COALESCE(p.status_laporan_akhir, 'belum_mengunggah') AS status_laporan_akhir,
			COALESCE(p.file_laporan_akhir, '') AS file_laporan_akhir,
			p.tanggal_mulai AS tanggal_mulai,
			p.tanggal_selesai AS tanggal_selesai,
			u.status_magang AS status_magang,
			pn.id AS penilaian_id,
			pn.nilai_profesional AS nilai_profesional,
			pn.nilai_personal AS nilai_personal,
			pn.nilai_sosial AS nilai_sosial,
			pn.nilai_administratif AS nilai_administratif,
			pn.nilai_akhir_angka AS nilai_akhir_angka,
			pn.indeks_nilai_akhir AS indeks_nilai_akhir,
			pn.predikat_akhir AS predikat_akhir,
			COALESCE(pn.status_penilaian, 'belum_dinilai') AS status_penilaian,
			COALESCE(pn.laporan_akhir_disetujui, 0) AS laporan_akhir_disetujui,
			pn.tanggal_penilaian AS tanggal_penilaian,
			COALESCE(pr_stat.total_presensi, 0) AS total_presensi,
			COALESCE(pr_stat.hadir_presensi, 0) AS hadir_presensi,
			COALESCE(pr_stat.total_poin_presensi, 0) AS total_poin_presensi,
			COALESCE(pr_stat.terisi_logbook, 0) AS terisi_logbook
		FROM user_manajemens u
		JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id AND p.mentor_id = ?
		LEFT JOIN penilaian_magangs pn ON pn.peserta_id = u.id
		LEFT JOIN (
			SELECT 
				peserta_id,
				COUNT(id) AS total_presensi,
				COUNT(CASE WHEN status IN ('hadir', 'terlambat') THEN 1 END) AS hadir_presensi,
				COALESCE(SUM(CASE 
					WHEN status = 'hadir' THEN 100.0 
					WHEN status = 'terlambat' THEN 75.0 
					WHEN status IN ('izin', 'sakit') THEN 50.0 
					ELSE 0.0 
				END), 0) AS total_poin_presensi,
				COUNT(CASE WHEN status IN ('hadir', 'terlambat') AND keterangan IS NOT NULL AND TRIM(keterangan) != '' AND keterangan != 'Tidak melakukan presensi' THEN 1 END) AS terisi_logbook
			FROM presensis
			GROUP BY peserta_id
		) pr_stat ON pr_stat.peserta_id = u.id
		WHERE u.role = 'peserta' AND u.status_akun = 'aktif'
		ORDER BY u.id DESC
	`, mentorID).Scan(&hasil)

	for i := range hasil {
		hasFile := strings.TrimSpace(hasil[i].FileLaporanAkhir) != ""
		if !hasFile {
			hasil[i].StatusLaporanAkhir = "belum_mengunggah"
		} else if hasil[i].LaporanAkhirDisetujui || hasil[i].StatusLaporanAkhir == "disetujui" {
			hasil[i].StatusLaporanAkhir = "disetujui"
		} else if hasil[i].StatusLaporanAkhir == "revisi" || hasil[i].StatusLaporanAkhir == "perlu_revisi" {
			hasil[i].StatusLaporanAkhir = "revisi"
		} else {
			hasil[i].StatusLaporanAkhir = "menunggu_review"
		}

		if hasil[i].TotalPresensi > 0 {
			hasil[i].PersenPresensi = math.Round((hasil[i].TotalPoinPresensi/float64(hasil[i].TotalPresensi))*10) / 10
			hasil[i].TotalLogbook = hasil[i].TotalPresensi
			hasil[i].AccLogbook = hasil[i].TerisiLogbook
			hasil[i].PersenLogbook = math.Round((float64(hasil[i].TerisiLogbook)/float64(hasil[i].TotalLogbook)*100.0)*10) / 10
		} else {
			hasil[i].PersenPresensi = 0.0
			hasil[i].TotalLogbook = 0
			hasil[i].AccLogbook = 0
			hasil[i].PersenLogbook = 0.0
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar bimbingan penilaian berhasil dimuat", hasil)
}

// [ROLE: ADMIN / MENTOR]
// GetDetailPenilaianPeserta mengambil rincian form evaluasi peserta tertentu beserta kalkulasi otomatis skor administratif dan pengaturan indikator aktif.
// Endpoint: GET /api/manajemen/admin/penilaian/:peserta_id (Admin) / GET /api/manajemen/mentor/penilaian/:peserta_id (Mentor)
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

	hasLaporanFile := strings.TrimSpace(pendaftaran.FileLaporanAkhir) != ""
	isLaporanAcc := hasLaporanFile && (penilaian.LaporanAkhirDisetujui || strings.ToLower(pendaftaran.StatusLaporanAkhir) == "disetujui")

	roleVal, _ := c.Get("role")
	roleStr, _ := roleVal.(string)

	// Validasi Opsi 2: Mentor hanya dapat membuka form penilaian jika laporan akhir sudah disetujui (ACC) oleh mentor
	if roleStr == "mentor" && (penilaian.ID == 0 || penilaian.StatusPenilaian == "belum_dinilai") && !isLaporanAcc {
		if !hasLaporanFile {
			utils.ErrorResponse(c, http.StatusBadRequest, "Form penilaian belum dapat dibuka. Peserta belum mengunggah naskah laporan akhir.")
		} else if strings.ToLower(pendaftaran.StatusLaporanAkhir) == "revisi" || strings.ToLower(pendaftaran.StatusLaporanAkhir) == "perlu_revisi" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Form penilaian belum dapat dibuka. Naskah laporan akhir peserta masih berstatus revisi.")
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Form penilaian belum dapat dibuka. Laporan akhir peserta belum disetujui (ACC) oleh mentor.")
		}
		return
	}

	// Pastikan catatan_mentor pada penilaian rapor tidak tercemar oleh catatan koreksi dokumen laporan akhir
	if penilaian.StatusPenilaian == "belum_dinilai" && (penilaian.CatatanMentor == pendaftaran.CatatanMentorLaporan || strings.Contains(strings.ToLower(penilaian.CatatanMentor), "bab") || strings.Contains(strings.ToLower(penilaian.CatatanMentor), "revisi") || penilaian.CatatanMentor == "perbaiki kembali bab 4") {
		penilaian.CatatanMentor = ""
		config.DB.Model(&penilaian).Update("catatan_mentor", "")
	}

	// Hitung otomatis skor administratif terbaru (jika sudah ACC laporan, beri skor 100 untuk komponen laporan)
	skorLaporanBool := penilaian.LaporanAkhirDisetujui || isLaporanAcc
	skorAbsensi, skorLogbook, skorTugas, skorLaporan, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, peserta.ID, skorLaporanBool)

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

	var mentor models.UserManajemen
	if pendaftaran.MentorID != nil {
		config.DB.First(&mentor, *pendaftaran.MentorID)
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail penilaian berhasil dimuat", gin.H{
		"peserta": gin.H{
			"id":                      peserta.ID,
			"nama":                    peserta.Nama,
			"email":                   peserta.Email,
			"foto_profil":             foto,
			"file_pas_foto":           pendaftaran.FilePasFoto,
			"bidang":                  pendaftaran.PosisiBidang,
			"institusi":               institusi,
			"jurusan":                 jurusan,
			"nim":                     nim,
			"tanggal_mulai":           pendaftaran.TanggalMulai,
			"tanggal_selesai":         pendaftaran.TanggalSelesai,
			"status_magang":           peserta.StatusMagang,
			"status_laporan_akhir":    pendaftaran.StatusLaporanAkhir,
			"file_laporan_akhir":      pendaftaran.FileLaporanAkhir,
			"laporan_akhir_disetujui": isLaporanAcc,
		},
		"mentor": gin.H{
			"id":      mentor.ID,
			"nama":    mentor.Nama,
			"nip":     mentor.Nip,
			"jabatan": mentor.Jabatan,
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

// [ROLE: MENTOR]
// SimpanPenilaianPeserta menyimpan nilai evaluasi 4 pilar kompetensi peserta (status 'draf' sementara atau 'final' yang langsung menerbitkan rapor).
// Endpoint: POST /api/manajemen/mentor/penilaian/:peserta_id
func SimpanPenilaianPeserta(c *gin.Context) {
	pesertaIDStr := c.Param("peserta_id")
	mentorID, ok := getUserIDFromContext(c)
	if !ok || mentorID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

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

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", peserta.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data pendaftaran peserta tidak ditemukan")
		return
	}

	// Validasi Opsi 2: Peserta wajib sudah mengunggah laporan akhir dan disetujui (ACC) mentor
	hasLaporanFile := strings.TrimSpace(pendaftaran.FileLaporanAkhir) != ""
	var cekPenilaian models.PenilaianMagang
	hasPenilaian := (config.DB.Where("peserta_id = ?", peserta.ID).First(&cekPenilaian).Error == nil)

	isLaporanAcc := hasLaporanFile && (strings.ToLower(pendaftaran.StatusLaporanAkhir) == "disetujui" || (hasPenilaian && cekPenilaian.LaporanAkhirDisetujui))

	if !isLaporanAcc {
		if !hasLaporanFile {
			utils.ErrorResponse(c, http.StatusBadRequest, "Penilaian belum dapat disimpan. Peserta belum mengunggah naskah laporan akhir.")
		} else if strings.ToLower(pendaftaran.StatusLaporanAkhir) == "revisi" || strings.ToLower(pendaftaran.StatusLaporanAkhir) == "perlu_revisi" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Penilaian belum dapat disimpan. Naskah laporan akhir peserta masih berstatus revisi.")
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Penilaian belum dapat disimpan. Laporan akhir peserta belum disetujui (ACC) oleh mentor.")
		}
		return
	}

	// Pastikan status laporan akhir disetujui bernilai true karena prasyarat telah terpenuhi
	input.LaporanAkhirDisetujui = true

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
		if input.LaporanAkhirDisetujui {
			_ = config.DB.Model(&models.PendaftaranMagang{}).
				Where("akun_peserta_id = ? AND file_laporan_akhir IS NOT NULL AND file_laporan_akhir != ''", peserta.ID).
				Update("status_laporan_akhir", "disetujui")
		} else {
			_ = config.DB.Model(&models.PendaftaranMagang{}).
				Where("akun_peserta_id = ? AND file_laporan_akhir IS NOT NULL AND file_laporan_akhir != '' AND status_laporan_akhir = 'disetujui'", peserta.ID).
				Update("status_laporan_akhir", "menunggu_review")
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
		if input.LaporanAkhirDisetujui {
			_ = config.DB.Model(&models.PendaftaranMagang{}).
				Where("akun_peserta_id = ? AND file_laporan_akhir IS NOT NULL AND file_laporan_akhir != ''", peserta.ID).
				Update("status_laporan_akhir", "disetujui")
		} else {
			_ = config.DB.Model(&models.PendaftaranMagang{}).
				Where("akun_peserta_id = ? AND file_laporan_akhir IS NOT NULL AND file_laporan_akhir != '' AND status_laporan_akhir = 'disetujui'", peserta.ID).
				Update("status_laporan_akhir", "menunggu_review")
		}
	}

	// Kirim notifikasi in-app & email ke peserta jika nilai akhir difinalisasi
	if status == "final" {
		go func(pid uint, nama, email string, na float64, prd string, penID uint) {
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pid,
				Tipe:         "rapor_nilai",
				Prioritas:    "tinggi",
				Judul:        "Rapor Nilai Akhir Diterbitkan",
				Pesan:        fmt.Sprintf("Evaluasi nilai akhir 4 pilar kompetensi magang Anda telah diterbitkan oleh mentor (Nilai: %.1f - %s).", na, prd),
				RefTabel:     "penilaian_magangs",
				RefID:        &penID,
				UrlTujuan:    "/peserta/penilaian/rapor",
			})

			if email != "" {
				nilaiStr := fmt.Sprintf("%.2f", na)
				bodyEmail := emailtemplates.TemplateNilaiAkhirDiterbitkan(nama, nilaiStr, prd)
				_ = services.SendEmail(email, "Rapor Nilai Akhir Magang Telah Diterbitkan", bodyEmail)
			}
		}(peserta.ID, peserta.Nama, peserta.Email, nilaiAkhir, predikatAkhir, penilaian.ID)
	}

	// Catatan: Notifikasi persetujuan laporan akhir peserta HANYA dikirimkan secara resmi
	// melalui menu Laporan Akhir Magang (VerifikasiLaporanAkhirMentor), bukan dari modal penilaian.

	// Kirim notifikasi in-app & email ke Admin jika peserta siap diterbitkan sertifikat
	if status == "final" {
		go func(pID uint, namaPeserta string, na float64, prd string, penID uint) {
			var pendaftaran models.PendaftaranMagang
			config.DB.Where("akun_peserta_id = ?", pID).Order("id desc").First(&pendaftaran)
			instansi := pendaftaran.AsalKampus
			if instansi == "" {
				instansi = pendaftaran.AsalSekolah
			}

			// In-app notifikasi ke seluruh admin
			services.KirimNotifikasiAdmin(
				"sertifikat_siap_terbit",
				"Peserta Siap Diterbitkan Sertifikat",
				fmt.Sprintf("Peserta %s telah menyelesaikan evaluasi magang (Nilai: %.1f - %s) dan laporan akhir telah disetujui. Siap diterbitkan sertifikat kelulusan.", namaPeserta, na, prd),
				"penilaian_magangs", &penID,
				"/admin/sertifikat",
				"tinggi", false,
			)

			// Email ke seluruh admin
			nilaiStr := fmt.Sprintf("%.2f", na)
			subject := "Peserta Siap Diterbitkan Sertifikat: " + namaPeserta
			body := emailtemplates.TemplatePesertaSiapSertifikatAdmin(namaPeserta, instansi, pendaftaran.PosisiBidang, nilaiStr, prd)
			services.KirimEmailKeSemuaAdmin(subject, body)
		}(peserta.ID, peserta.Nama, nilaiAkhir, predikatAkhir, penilaian.ID)
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

// [ROLE: PESERTA]
// GetNilaiSaya mengambil lembar transkrip nilai resmi hasil evaluasi akhir magang 4 pilar kompetensi bagi peserta yang telah dinilai final.
// Endpoint: GET /api/manajemen/peserta/penilaian
func GetNilaiSaya(c *gin.Context) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok || pesertaID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

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
	if err := config.DB.Where("peserta_id = ? AND status_penilaian = 'final'", peserta.ID).First(&penilaian).Error; err != nil {
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
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"jabatan":     mentor.Jabatan,
				"nip":         mentor.Nip,
				"foto_profil": mentor.FotoProfil,
			},
		})
		return
	}

	// Pastikan data mentor termuat dari penilaian jika sebelumnya kosong
	if mentor.ID == 0 && penilaian.MentorID != 0 {
		config.DB.First(&mentor, penilaian.MentorID)
	}

	// Ambil data instansi / landing untuk kop & stempel
	var landing models.PengaturanLandingPage
	config.DB.First(&landing)

	// Ambil template surat penerimaan untuk data pejabat penandatangan jika tersedia
	var suratSetting models.TemplateSurat
	if err := config.DB.Where("is_default = ?", true).First(&suratSetting).Error; err != nil {
		config.DB.Order("id asc").First(&suratSetting)
	}

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
			"id":          mentor.ID,
			"nama":        mentor.Nama,
			"jabatan":     mentor.Jabatan,
			"nip":         mentor.Nip,
			"foto_profil": mentor.FotoProfil,
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

// ==============================================================================
// ── TEMPLATE RAPOR / TRANSKRIP NILAI BUILDER ─────────────────────────────────
// ==============================================================================

// [ROLE: ADMIN]
// GetAllTemplateRapor mengambil seluruh daftar template desain rapor / transkrip nilai magang yang tersimpan.
// Endpoint: GET /api/manajemen/admin/template-rapor
func GetAllTemplateRapor(c *gin.Context) {
	var list []models.TemplateRapor
	if err := config.DB.Order("is_default desc, id desc").Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat daftar template rapor")
		return
	}

	// Jika masih kosong, buat 1 template bawaan otomatis
	if len(list) == 0 {
		tplDefault := models.TemplateRapor{
			Nama:                 "Template Standar Kedinasan Diskominfo",
			Keterangan:           "Format baku transkrip nilai magang resmi Diskominfo Ponorogo",
			Status:               "publish",
			IsDefault:            true,
			NamaPemerintah:       "PEMERINTAH KABUPATEN PONOROGO",
			NamaInstansi:         "DINAS KOMUNIKASI, INFORMATIKA DAN STATISTIK",
			AlamatInstansi:       "Jl. Ir. H. Juanda No. 195 Ponorogo, Jawa Timur 63419",
			Telepon:              "(0352) 481105",
			Laman:                "kominfo.ponorogo.go.id",
			PosEl:                "kominfo@ponorogo.go.id",
			JudulDokumen:         "TRANSKRIP NILAI HASIL MAGANG",
			FormatNomor:          "560/TRN-{nomor}/405.08/{tahun}",
			TempatTerbit:         "Ponorogo",
			TipePenandatangan:    "kepala_dinas",
			JabatanPenandatangan: "Kepala Dinas Komunikasi, Informatika dan Statistik",
			NamaPenandatangan:    "Drs. BAMBANG SUHENDRO, M.Si",
			PangkatPenandatangan: "Pembina Utama Muda",
			NipPenandatangan:     "19750812 200003 1 004",
			KonfigurasiTataLetak: `{"tampilkan_bobot":true,"tampilkan_qr":true,"tampilkan_catatan_mentor":true,"tampilkan_garis_kop":true,"tampilkan_foto_peserta":false}`,
		}
		_ = config.DB.Create(&tplDefault).Error
		list = append(list, tplDefault)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar template rapor berhasil dimuat", list)
}

// [ROLE: ADMIN]
// GetTemplateRapor mengambil detail satu konfigurasi template rapor berdasarkan ID template.
// Endpoint: GET /api/manajemen/admin/template-rapor/:id
func GetTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil dimuat", tpl)
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// GetTemplateRaporAktif mengambil konfigurasi template rapor default berstatus publish untuk keperluan rendering/cetak dokumen transkrip nilai.
// Endpoint: GET /api/manajemen/template-rapor/aktif
func GetTemplateRaporAktif(c *gin.Context) {
	var tpl models.TemplateRapor
	if err := config.DB.Where("is_default = ? AND status = ?", true, "publish").First(&tpl).Error; err != nil {
		if errFirst := config.DB.Order("id asc").First(&tpl).Error; errFirst != nil {
			tpl = models.TemplateRapor{
				Nama:                 "Template Standar Kedinasan Diskominfo",
				JenisPeserta:         "semua",
				NamaPemerintah:       "PEMERINTAH KABUPATEN PONOROGO",
				NamaInstansi:         "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
				AlamatInstansi:       "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
				Telepon:              "Telepon 0352–3592999",
				JudulDokumen:         "TRANSKRIP NILAI HASIL MAGANG",
				FormatNomor:          "560/TRN-{nomor}/405.08/{tahun}",
				TempatTerbit:         "Ponorogo",
				TipePenandatangan:    "kepala_dinas",
				JabatanPenandatangan: "Kepala Dinas Komunikasi Informatika dan Statistik",
				NamaPenandatangan:    "Drs. BAMBANG SUHENDRO, M.Si",
				NipPenandatangan:     "19750812 200003 1 004",
				IsDefault:            true,
				Status:               "publish",
			}
		}
	}
	utils.SuccessResponse(c, http.StatusOK, "Template rapor aktif berhasil dimuat", tpl)
}

// [ROLE: ADMIN]
// CreateTemplateRapor membuat format desain template transkrip nilai / rapor magang baru.
// Endpoint: POST /api/manajemen/admin/template-rapor
func CreateTemplateRapor(c *gin.Context) {
	var input models.TemplateRapor
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data input tidak valid: "+err.Error())
		return
	}

	if strings.TrimSpace(input.Nama) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	if input.JenisPeserta == "" {
		input.JenisPeserta = "semua"
	}

	// Jika dijadikan default, nonaktifkan is_default pada template lain
	if input.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Where("id > 0").Update("is_default", false)
	}

	if err := config.DB.Create(&input).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat template rapor: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template rapor berhasil dibuat", input)
}

// [ROLE: ADMIN]
// UpdateTemplateRapor memperbarui data identitas kop, format penomoran, pejabat penandatangan, atau tata letak template rapor.
// Endpoint: PUT /api/manajemen/admin/template-rapor/:id
func UpdateTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	var input models.TemplateRapor
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data input tidak valid: "+err.Error())
		return
	}

	if strings.TrimSpace(input.Nama) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	if input.IsDefault && !tpl.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Where("id != ?", tpl.ID).Update("is_default", false)
	}

	tpl.Nama = input.Nama
	tpl.Keterangan = input.Keterangan
	if input.JenisPeserta != "" {
		tpl.JenisPeserta = input.JenisPeserta
	}
	tpl.Status = input.Status
	tpl.IsDefault = input.IsDefault
	tpl.NamaPemerintah = input.NamaPemerintah
	tpl.NamaInstansi = input.NamaInstansi
	tpl.AlamatInstansi = input.AlamatInstansi
	tpl.Telepon = input.Telepon
	tpl.Laman = input.Laman
	tpl.PosEl = input.PosEl
	tpl.JudulDokumen = input.JudulDokumen
	tpl.FormatNomor = input.FormatNomor
	tpl.TempatTerbit = input.TempatTerbit
	tpl.CatatanKaki = input.CatatanKaki
	tpl.TipePenandatangan = input.TipePenandatangan
	tpl.JabatanPenandatangan = input.JabatanPenandatangan
	tpl.NamaPenandatangan = input.NamaPenandatangan
	tpl.PangkatPenandatangan = input.PangkatPenandatangan
	tpl.NipPenandatangan = input.NipPenandatangan
	if input.KonfigurasiTataLetak != "" {
		tpl.KonfigurasiTataLetak = input.KonfigurasiTataLetak
	}

	if err := config.DB.Save(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui template rapor: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil diperbarui", tpl)
}

// [ROLE: ADMIN]
// DeleteTemplateRapor menghapus template rapor beserta berkas fisik gambar asetnya dari server.
// Endpoint: DELETE /api/manajemen/admin/template-rapor/:id
func DeleteTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	// Hapus file aset jika ada
	for _, f := range []string{tpl.FileLogo, tpl.FileTtd, tpl.FileStempel} {
		if f != "" {
			_ = os.Remove(f)
		}
	}

	if err := config.DB.Delete(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus template rapor: "+err.Error())
		return
	}

	// Jika yang dihapus adalah default, jadikan template pertama sebagai default
	if tpl.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Order("id asc").Limit(1).Update("is_default", true)
	}

	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil dihapus", nil)
}

// [ROLE: ADMIN]
// SetDefaultTemplateRapor menetapkan template rapor tertentu sebagai template standar utama sistem.
// Endpoint: PUT /api/manajemen/admin/template-rapor/:id/default
func SetDefaultTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	config.DB.Model(&models.TemplateRapor{}).Where("id > 0").Update("is_default", false)
	tpl.IsDefault = true
	tpl.Status = "publish"
	config.DB.Save(&tpl)

	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Template '%s' berhasil dijadikan template utama", tpl.Nama), tpl)
}

// [ROLE: ADMIN]
// DuplikatTemplateRapor menggandakan template rapor yang sudah ada untuk mempercepat pembuatan variasi template baru.
// Endpoint: POST /api/manajemen/admin/template-rapor/:id/duplikat
func DuplikatTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	duplikat := tpl
	duplikat.ID = 0
	duplikat.Nama = fmt.Sprintf("%s (Salinan)", tpl.Nama)
	duplikat.IsDefault = false
	duplikat.CreatedAt = time.Now()
	duplikat.UpdatedAt = time.Now()

	if err := config.DB.Create(&duplikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menduplikat template: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template rapor berhasil diduplikat", duplikat)
}

// [ROLE: ADMIN]
// UploadFileTemplateRapor mengunggah berkas aset gambar template rapor seperti logo instansi, tanda tangan, atau stempel kedinasan.
// Endpoint: POST /api/manajemen/admin/template-rapor/:id/upload/:jenis
func UploadFileTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis") // "logo", "ttd", "stempel"

	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".svg": true}
	if !allowed[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, JPEG, atau SVG")
		return
	}

	uploadDir := filepath.Join("uploads", "rapor", jenis)
	_ = os.MkdirAll(uploadDir, os.ModePerm)

	fileName := fmt.Sprintf("tpl_%s_%d_%d%s", jenis, tpl.ID, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	if errSave := c.SaveUploadedFile(file, savePath); errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file aset: "+errSave.Error())
		return
	}

	switch jenis {
	case "logo":
		if tpl.FileLogo != "" {
			_ = os.Remove(tpl.FileLogo)
		}
		tpl.FileLogo = cleanPath
	case "ttd":
		if tpl.FileTtd != "" {
			_ = os.Remove(tpl.FileTtd)
		}
		tpl.FileTtd = cleanPath
	case "stempel":
		if tpl.FileStempel != "" {
			_ = os.Remove(tpl.FileStempel)
		}
		tpl.FileStempel = cleanPath
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis aset tidak dikenal")
		return
	}

	config.DB.Save(&tpl)
	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Aset %s berhasil diunggah", jenis), tpl)
}

// [ROLE: ADMIN]
// DeleteFileTemplateRapor menghapus berkas aset gambar tertentu dari template rapor.
// Endpoint: DELETE /api/manajemen/admin/template-rapor/:id/upload/:jenis
func DeleteFileTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")

	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	switch jenis {
	case "logo":
		if tpl.FileLogo != "" {
			_ = os.Remove(tpl.FileLogo)
		}
		tpl.FileLogo = ""
	case "ttd":
		if tpl.FileTtd != "" {
			_ = os.Remove(tpl.FileTtd)
		}
		tpl.FileTtd = ""
	case "stempel":
		if tpl.FileStempel != "" {
			_ = os.Remove(tpl.FileStempel)
		}
		tpl.FileStempel = ""
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis aset tidak dikenal")
		return
	}

	config.DB.Save(&tpl)
	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Aset %s berhasil dihapus", jenis), tpl)
}
