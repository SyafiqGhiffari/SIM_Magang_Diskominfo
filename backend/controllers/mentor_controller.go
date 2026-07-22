package controllers

import (
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

type AssignBidangMentorInput struct {
	BidangID *uint `json:"bidang_id"`
}

// AssignBidangMentor — menetapkan atau melepas bidang tempat mentor ini ditugaskan.
// Sumber kebenaran sekarang ada di UserManajemen.BidangID (bukan lagi di BidangMagang),
// sehingga satu bidang bisa memiliki banyak mentor sekaligus.
func AssignBidangMentor(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}
	if user.Role != "mentor" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hanya akun mentor yang dapat ditugaskan ke bidang")
		return
	}

	var input AssignBidangMentorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	user.BidangID = input.BidangID
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui penugasan bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Penugasan bidang berhasil diperbarui", nil)
}

// CekMentorMasihDipakai — dipakai DeleteUserManajemen & CekUserBisaDihapus untuk
// memvalidasi mentor sebelum dihapus (cek apakah masih membimbing peserta tertentu).
func CekMentorMasihDipakai(userID uint) (int64, []string) {
	var pendaftaranList []models.PendaftaranMagang
	config.DB.Where("mentor_id = ?", userID).Find(&pendaftaranList)

	namaPeserta := make([]string, 0, len(pendaftaranList))
	for _, p := range pendaftaranList {
		namaPeserta = append(namaPeserta, p.NamaLengkap)
	}
	return int64(len(pendaftaranList)), namaPeserta
}

// GetPesertaBimbinganMentor — daftar peserta yang dibimbing oleh mentor tertentu,
// untuk ditampilkan di modal "Peserta Bimbingan" pada halaman Kelola Mentor.
func GetPesertaBimbinganMentor(c *gin.Context) {
	mentorID := c.Param("id")

	var mentor models.UserManajemen
	if err := config.DB.First(&mentor, mentorID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Mentor tidak ditemukan")
		return
	}
	if mentor.Role != "mentor" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun ini bukan akun mentor")
		return
	}

	var pendaftaranList []models.PendaftaranMagang
	if err := config.DB.Preload("AkunPeserta").Where("mentor_id = ?", mentor.ID).Find(&pendaftaranList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta bimbingan")
		return
	}

	type PesertaBimbinganResp struct {
		ID             uint   `json:"id"`
		NamaLengkap    string `json:"nama_lengkap"`
		Institusi      string `json:"institusi"`
		PosisiBidang   string `json:"posisi_bidang"`
		TanggalMulai   string `json:"tanggal_mulai"`
		TanggalSelesai string `json:"tanggal_selesai"`
		StatusAkun     string `json:"status_akun"`
		FotoProfil     string `json:"foto_profil"`
	}

	result := make([]PesertaBimbinganResp, 0, len(pendaftaranList))
	for _, p := range pendaftaranList {
		institusi := p.AsalSekolah
		if p.KategoriPendaftar == "mahasiswa" {
			institusi = p.AsalKampus
		}

		resp := PesertaBimbinganResp{
			ID:             p.ID,
			NamaLengkap:    p.NamaLengkap,
			Institusi:      institusi,
			PosisiBidang:   p.PosisiBidang,
			TanggalMulai:   p.TanggalMulai,
			TanggalSelesai: p.TanggalSelesai,
		}
		if p.AkunPeserta != nil {
			resp.StatusAkun = p.AkunPeserta.StatusAkun
			resp.FotoProfil = p.AkunPeserta.FotoProfil
		}
		result = append(result, resp)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data peserta bimbingan berhasil diambil", result)
}