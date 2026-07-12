package controllers

import (
	"net/http"

	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

func TestKirimEmail(c *gin.Context) {
	tipe := c.Query("tipe") // ?tipe=berhasil / ?tipe=diterima / ?tipe=ditolak / dst
	emailTujuan := c.Query("email")

	if emailTujuan == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Parameter 'email' wajib diisi, contoh: ?email=kamu@gmail.com")
		return
	}

	var subject, body string

	switch tipe {
	case "berhasil":
		subject = "Pendaftaran Magang Berhasil Dikirim"
		body = emailtemplates.TemplatePendaftaranBerhasil("Nama Testing")
	case "diterima":
		subject = emailtemplates.SubjectStatusPendaftaran("diterima")
		body = emailtemplates.TemplateStatusPendaftaran("Nama Testing", "diterima", "Selamat bergabung!")
	case "ditolak":
		subject = emailtemplates.SubjectStatusPendaftaran("ditolak")
		body = emailtemplates.TemplateStatusPendaftaran("Nama Testing", "ditolak", "Kuota bidang sudah penuh.")
	case "revisi":
		subject = emailtemplates.SubjectStatusPendaftaran("revisi")
		body = emailtemplates.TemplateStatusPendaftaran("Nama Testing", "revisi", "Mohon unggah ulang surat pengantar yang jelas.")
	case "menunggu":
		subject = emailtemplates.SubjectStatusPendaftaran("menunggu")
		body = emailtemplates.TemplateStatusPendaftaran("Nama Testing", "menunggu", "")
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Parameter 'tipe' harus salah satu: berhasil, menunggu, revisi, diterima, ditolak")
		return
	}

	if err := services.SendEmail(emailTujuan, subject, body); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Email test berhasil dikirim ke "+emailTujuan, nil)
}