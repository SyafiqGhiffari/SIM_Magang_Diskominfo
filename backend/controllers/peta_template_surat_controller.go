package controllers

import (
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// GET /api/manajemen/admin/template-surat/:id/peta?kategori=mahasiswa
//
// Mengembalikan posisi (mm) setiap bagian surat pada pratinjau, beserta
// nama field tata letak yang berubah bila bagian itu digeser. Dipakai
// lapisan geser di atas pratinjau PDF pada modal template surat.
func PetaTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}

	kategori := c.DefaultQuery("kategori", "mahasiswa")
	peta, err := services.PetaSuratPratinjau(tpl, kategori)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung posisi blok: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Peta blok surat berhasil diambil", peta)
}