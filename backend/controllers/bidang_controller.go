package controllers

import (
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
	utils.SuccessResponse(c, http.StatusOK, "Data bidang berhasil diambil", bidangList)
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

func DeleteBidang(c *gin.Context) {
	id := c.Param("id")

	var bidang models.BidangMagang
	if err := config.DB.First(&bidang, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Bidang tidak ditemukan")
		return
	}

	if err := config.DB.Delete(&bidang).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Bidang berhasil dihapus", nil)
}