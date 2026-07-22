package controllers

import (
	"fmt"
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

type BidangInput struct {
	Nama      string `json:"nama" binding:"required"`
	Deskripsi string `json:"deskripsi"`
	Kuota     int    `json:"kuota"`
	IsActive  *bool  `json:"is_active"`
}

func GetAllBidang(c *gin.Context) {
	var bidangList []models.BidangMagang
	if err := config.DB.Order("nama asc").Find(&bidangList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data bidang")
		return
	}

	// Hitung jumlah mentor per bidang (relasi sekarang ada di UserManajemen.BidangID)
	type bidangResp struct {
		models.BidangMagang
		JumlahMentor int64 `json:"jumlah_mentor"`
	}

	result := make([]bidangResp, 0, len(bidangList))
	for _, b := range bidangList {
		var jumlahMentor int64
		config.DB.Model(&models.UserManajemen{}).Where("role = ? AND bidang_id = ?", "mentor", b.ID).Count(&jumlahMentor)
		result = append(result, bidangResp{BidangMagang: b, JumlahMentor: jumlahMentor})
	}

	utils.SuccessResponse(c, http.StatusOK, "Data bidang berhasil diambil", result)
}

func CreateBidang(c *gin.Context) {
	var input BidangInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama bidang wajib diisi")
		return
	}

	var existing models.BidangMagang
	if err := config.DB.Where("nama = ?", input.Nama).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Bidang dengan nama tersebut sudah ada")
		return
	}

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	bidang := models.BidangMagang{
		Nama:      input.Nama,
		Deskripsi: input.Deskripsi,
		Kuota:     input.Kuota,
		IsActive:  isActive,
	}
	if err := config.DB.Create(&bidang).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat bidang baru")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Bidang berhasil ditambahkan", bidang)
}

func UpdateBidang(c *gin.Context) {
	id := c.Param("id")

	var bidang models.BidangMagang
	if err := config.DB.First(&bidang, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bidang tidak ditemukan")
		return
	}

	var input BidangInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama bidang wajib diisi")
		return
	}

	bidang.Nama = input.Nama
	bidang.Deskripsi = input.Deskripsi
	bidang.Kuota = input.Kuota
	if input.IsActive != nil {
		bidang.IsActive = *input.IsActive
	}

	if err := config.DB.Save(&bidang).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Bidang berhasil diperbarui", bidang)
}

func ToggleStatusBidang(c *gin.Context) {
	id := c.Param("id")

	var bidang models.BidangMagang
	if err := config.DB.First(&bidang, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bidang tidak ditemukan")
		return
	}

	bidang.IsActive = !bidang.IsActive
	if err := config.DB.Save(&bidang).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui status bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Status bidang berhasil diperbarui", bidang)
}

// CekBidangBisaDihapus — dipanggil frontend SEBELUM menampilkan dialog konfirmasi hapus,
// supaya admin bisa diberi tahu alasannya lebih dulu tanpa perlu mencoba hapus dan gagal.
func CekBidangBisaDihapus(c *gin.Context) {
	id := c.Param("id")

	var bidang models.BidangMagang
	if err := config.DB.First(&bidang, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bidang tidak ditemukan")
		return
	}

	var jumlahPeserta int64
	config.DB.Model(&models.PendaftaranMagang{}).
		Where("posisi_bidang = ? AND status_pendaftaran = ?", bidang.Nama, "diterima").
		Count(&jumlahPeserta)

	var mentorList []models.UserManajemen
	config.DB.Where("role = ? AND bidang_id = ?", "mentor", bidang.ID).Find(&mentorList)

	namaMentor := make([]string, 0, len(mentorList))
	for _, m := range mentorList {
		namaMentor = append(namaMentor, m.Nama)
	}

	bisaDihapus := jumlahPeserta == 0 && len(mentorList) == 0

	utils.SuccessResponse(c, http.StatusOK, "Pengecekan berhasil", gin.H{
		"bisa_dihapus":   bisaDihapus,
		"jumlah_peserta": jumlahPeserta,
		"ada_mentor":     len(mentorList) > 0,
		"jumlah_mentor":  len(mentorList),
		"nama_mentor":    namaMentor,
	})
}

func DeleteBidang(c *gin.Context) {
	id := c.Param("id")

	var bidang models.BidangMagang
	if err := config.DB.First(&bidang, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bidang tidak ditemukan")
		return
	}

	// Cek peserta yang sudah diterima di bidang ini — dibandingkan berdasarkan
	// nama (karena posisi_bidang di PendaftaranMagang adalah kolom teks biasa,
	// bukan foreign key sungguhan ke BidangMagang).
	var jumlahPeserta int64
	config.DB.Model(&models.PendaftaranMagang{}).
		Where("posisi_bidang = ? AND status_pendaftaran = ?", bidang.Nama, "diterima").
		Count(&jumlahPeserta)

	if jumlahPeserta > 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf(
			"Bidang tidak dapat dihapus karena masih ada %d peserta yang diterima di bidang ini. Nonaktifkan bidang ini terlebih dahulu jika tidak ingin menerima pendaftar baru.",
			jumlahPeserta,
		))
		return
	}

	// Cek mentor yang masih ditugaskan di bidang ini.
	var jumlahMentor int64
	config.DB.Model(&models.UserManajemen{}).Where("role = ? AND bidang_id = ?", "mentor", bidang.ID).Count(&jumlahMentor)
	if jumlahMentor > 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf(
			"Bidang tidak dapat dihapus karena masih ada %d mentor yang ditugaskan di bidang ini. Pindahkan mentor tersebut terlebih dahulu melalui menu Edit Mentor.",
			jumlahMentor,
		))
		return
	}

	if err := config.DB.Delete(&bidang).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Bidang berhasil dihapus", nil)
}

func GetPublicBidang(c *gin.Context) {
	var bidangList []models.BidangMagang
	if err := config.DB.Where("is_active = ?", true).Order("nama asc").Find(&bidangList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data bidang")
		return
	}

	type publicBidang struct {
		ID        uint   `json:"id"`
		Nama      string `json:"nama"`
		Deskripsi string `json:"deskripsi"`
		Kuota     int    `json:"kuota"`
		Terisi    int    `json:"terisi"`
	}

	result := make([]publicBidang, 0, len(bidangList))
	for _, b := range bidangList {
		var terisi int64
		config.DB.Model(&models.PendaftaranMagang{}).
			Where("posisi_bidang = ? AND status_pendaftaran = ?", b.Nama, "diterima").
			Count(&terisi)

		result = append(result, publicBidang{
			ID:        b.ID,
			Nama:      b.Nama,
			Deskripsi: b.Deskripsi,
			Kuota:     b.Kuota,
			Terisi:    int(terisi),
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Data bidang berhasil diambil", result)
}