package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ── 1. Get Logbook & Riwayat Presensi Peserta ─────────────────────────────────────

func GetLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	// Ambil data mentor
	var mentorData gin.H = nil
	if hasPendaftaran && pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
			}
		}
	}

	// Ambil seluruh daftar presensi peserta
	var presensiList []models.Presensi
	config.DB.
		Where("peserta_id = ?", pesertaID).
		Order("tanggal desc").
		Find(&presensiList)

	// Hitung statistik logbook
	totalPresensi := len(presensiList)
	totalHadir := 0
	totalLogbookTerisi := 0
	for _, p := range presensiList {
		if p.Status == "hadir" || p.Status == "terlambat" {
			totalHadir++
		}
		if strings.TrimSpace(p.Keterangan) != "" {
			totalLogbookTerisi++
		}
	}

	persenLogbook := 0.0
	if totalHadir > 0 {
		persenLogbook = float64(totalLogbookTerisi) / float64(totalHadir) * 100
		if persenLogbook > 100 {
			persenLogbook = 100
		}
	}

	// Format data instansi untuk ekspor PDF
	var landing models.PengaturanLandingPage
	config.DB.First(&landing)
	var suratSetting models.PengaturanSuratPenerimaan
	config.DB.First(&suratSetting)

	utils.SuccessResponse(c, http.StatusOK, "Data logbook peserta berhasil dimuat", gin.H{
		"peserta": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"no_hp":         user.NoHp,
			"foto_profil":   user.FotoProfil,
			"status_magang": user.StatusMagang,
		},
		"pendaftaran": gin.H{
			"posisi_bidang":   pendaftaran.PosisiBidang,
			"institusi":       coalesceString(pendaftaran.AsalKampus, pendaftaran.AsalSekolah),
			"jurusan":         coalesceString(pendaftaran.ProgramStudi, pendaftaran.JurusanSekolah),
			"nim":             coalesceString(pendaftaran.NpmNim, pendaftaran.Nisn),
			"tanggal_mulai":   pendaftaran.TanggalMulai,
			"tanggal_selesai": pendaftaran.TanggalSelesai,
		},
		"mentor": mentorData,
		"instansi": gin.H{
			"nama_pemerintah": landing.SubJudulSitus,
			"nama_instansi":   landing.NamaSitus,
			"alamat_instansi": landing.AlamatLengkap,
			"logo":            landing.FileLogo,
			"pejabat_nama":    suratSetting.NamaPenandatangan,
			"pejabat_nip":     suratSetting.NipPenandatangan,
			"pejabat_jabatan": suratSetting.JabatanPenandatangan,
			"stempel":         suratSetting.FileStempel,
			"ttd_pejabat":     suratSetting.FileTtd,
		},
		"statistik": gin.H{
			"total_presensi":       totalPresensi,
			"total_hadir":          totalHadir,
			"total_logbook_terisi": totalLogbookTerisi,
			"persentase_pengisian": persenLogbook,
		},
		"logbook": presensiList,
	})
}

// ── 2. Update Catatan Logbook Harian Peserta ───────────────────────────────────

func UpdateLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	presensiID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID presensi tidak valid")
		return
	}

	var presensi models.Presensi
	if err := config.DB.Where("id = ? AND peserta_id = ?", presensiID, pesertaID).First(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Catatan presensi tidak ditemukan")
		return
	}

	var req struct {
		Keterangan string `json:"keterangan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Deskripsi logbook wajib diisi")
		return
	}

	presensi.Keterangan = strings.TrimSpace(req.Keterangan)
	if err := config.DB.Save(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui catatan logbook")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Catatan logbook berhasil diperbarui", presensi)
}




func coalesceString(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

