package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)
type RegisterManajemenInput struct {
	Nama               string `json:"nama" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required,min=6"`
	Role               string `json:"role" binding:"required"`
	NoHp               string `json:"no_hp"`
	Jabatan            string `json:"jabatan"`
	KapasitasBimbingan int    `json:"kapasitas_bimbingan"`
	BidangID           *uint  `json:"bidang_id"` // opsional, hanya relevan untuk role=mentor
}

type LoginManajemenInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func RegisterManajemen(c *gin.Context) {
	var input RegisterManajemenInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	if input.Role != "admin" && input.Role != "mentor" && input.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Role tidak valid")
		return
	}

	var existingUser models.UserManajemen
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email sudah terdaftar")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password")
		return
	}

	user := models.UserManajemen{
		Nama:               input.Nama,
		Email:              input.Email,
		Password:           string(hashedPassword),
		Role:               input.Role,
		NoHp:               input.NoHp,
		Jabatan:            input.Jabatan,
		KapasitasBimbingan: input.KapasitasBimbingan,
		StatusAkun:         "aktif",
	}

	// Relasi mentor->bidang sekarang disimpan langsung di UserManajemen.BidangID
	// (bukan lagi di BidangMagang.MentorID), supaya satu bidang bisa punya banyak mentor.
	if input.Role == "mentor" {
		user.BidangID = input.BidangID
	}

	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat akun manajemen")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Register akun manajemen berhasil", gin.H{
		"id":          user.ID,
		"nama":        user.Nama,
		"email":       user.Email,
		"role":        user.Role,
		"status_akun": user.StatusAkun,
	})
}

func LoginManajemen(c *gin.Context) {
	var input LoginManajemenInput

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	var user models.UserManajemen
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Email atau password salah")
		return
	}

	if user.StatusAkun != "aktif" {
		utils.ErrorResponse(c, http.StatusForbidden, "Akun manajemen tidak aktif")
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Email atau password salah")
		return
	}

	token, err := services.GenerateToken(user.ID, user.Email, user.Role, "manajemen", "")
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat token")
		return
	}

	// Set status online saat login berhasil
	config.DB.Model(&user).Update("is_online", true)

	utils.SuccessResponse(c, http.StatusOK, "Login manajemen berhasil", gin.H{
		"token": token,
		"user": gin.H{
			"id":          user.ID,
			"nama":        user.Nama,
			"email":       user.Email,
			"role":        user.Role,
			"status_akun": user.StatusAkun,
		},
	})
}

// LogoutManajemen mengubah status admin menjadi offline
func LogoutManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	// Set status offline saat logout
	config.DB.Model(&user).Update("is_online", false)

	utils.SuccessResponse(c, http.StatusOK, "Logout manajemen berhasil", nil)
}

type GantiPasswordManajemenInput struct {
	OldPassword     string `json:"oldPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// GantiPasswordManajemen — user manajemen (admin/mentor/peserta) mengganti password sendiri
func GantiPasswordManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var input GantiPasswordManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password lama, baru, dan konfirmasi wajib diisi minimal 6 karakter")
		return
	}
	if input.NewPassword != input.ConfirmPassword {
		utils.ErrorResponse(c, http.StatusBadRequest, "Konfirmasi password tidak cocok")
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.OldPassword)); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password lama tidak sesuai")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password baru")
		return
	}

	user.Password = string(hashed)
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui password")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password berhasil diperbarui", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Kelola akun manajemen (buat, lihat, ubah status, hapus)
// ─────────────────────────────────────────────────────────────────────────────

// GetAllUserManajemen — admin melihat semua akun manajemen (admin/mentor/peserta)
func GetAllUserManajemen(c *gin.Context) {
	var users []models.UserManajemen
	if err := config.DB.Order("created_at desc").Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data akun manajemen")
		return
	}

	// Ambil semua bidang untuk dipetakan berdasarkan ID (relasi sekarang: mentor -> bidang_id)
	var bidangList []models.BidangMagang
	config.DB.Find(&bidangList)
	bidangByID := map[uint]models.BidangMagang{}
	for _, b := range bidangList {
		bidangByID[b.ID] = b
	}

	type UserResp struct {
		ID                 uint   `json:"id"`
		Nama               string `json:"nama"`
		Email              string `json:"email"`
		Role               string `json:"role"`
		StatusAkun         string `json:"status_akun"`
		IsOnline           bool   `json:"is_online"`
		NoHp               string `json:"no_hp"`
		Jabatan            string `json:"jabatan"`
		KapasitasBimbingan int    `json:"kapasitas_bimbingan"`
		FotoProfil         string `json:"foto_profil"`
		BidangID           *uint  `json:"bidang_id"`
		BidangNama         string `json:"bidang_nama"`
		JumlahBimbingan    int64  `json:"jumlah_bimbingan"`
	}

	var result []UserResp
	for _, u := range users {
		resp := UserResp{
			ID: u.ID, Nama: u.Nama, Email: u.Email,
			Role: u.Role, StatusAkun: u.StatusAkun, IsOnline: u.IsOnline,
			NoHp: u.NoHp, Jabatan: u.Jabatan, KapasitasBimbingan: u.KapasitasBimbingan,
			FotoProfil: u.FotoProfil,
		}
		if u.BidangID != nil {
			if b, ok := bidangByID[*u.BidangID]; ok {
				resp.BidangID = &b.ID
				resp.BidangNama = b.Nama
			}
		}
		if u.Role == "mentor" {
			var jumlahBimbingan int64
			config.DB.Model(&models.PendaftaranMagang{}).Where("mentor_id = ?", u.ID).Count(&jumlahBimbingan)
			resp.JumlahBimbingan = jumlahBimbingan
		}
		result = append(result, resp)
	}
	if result == nil {
		result = []UserResp{}
	}

	utils.SuccessResponse(c, http.StatusOK, "Data akun manajemen berhasil diambil", result)
}

type UpdateStatusUserManajemenInput struct {
	StatusAkun string `json:"status_akun" binding:"required"`
}

// UpdateStatusUserManajemen — admin mengaktifkan/menonaktifkan akun manajemen lain
func UpdateStatusUserManajemen(c *gin.Context) {
	id := c.Param("id")
	requesterID := uint(c.GetFloat64("user_id"))

	var input UpdateStatusUserManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status akun wajib diisi")
		return
	}
	if input.StatusAkun != "aktif" && input.StatusAkun != "nonaktif" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status akun harus aktif atau nonaktif")
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}

	if user.ID == requesterID && input.StatusAkun == "nonaktif" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda tidak dapat menonaktifkan akun Anda sendiri")
		return
	}

	user.StatusAkun = input.StatusAkun
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui status akun")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Status akun berhasil diperbarui", gin.H{
		"id": user.ID, "status_akun": user.StatusAkun,
	})
}

// DeleteUserManajemen — admin menghapus akun manajemen lain
func DeleteUserManajemen(c *gin.Context) {
	id := c.Param("id")
	requesterID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}

	if user.ID == requesterID {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda tidak dapat menghapus akun Anda sendiri")
		return
	}

	if user.Role == "mentor" {
		jumlahPeserta, _ := CekMentorMasihDipakai(user.ID)
		if jumlahPeserta > 0 {
			utils.ErrorResponse(c, http.StatusBadRequest, "Mentor tidak dapat dihapus karena masih membimbing satu atau lebih peserta. Pindahkan bimbingan peserta terlebih dahulu.")
			return
		}
	}

	if user.Role == "peserta" {
		bisa, alasan := CekPesertaBisaDihapus(user.ID)
		if !bisa {
			utils.ErrorResponse(c, http.StatusBadRequest, "Akun peserta tidak dapat dihapus karena "+strings.Join(alasan, " dan ")+". Nonaktifkan akun terlebih dahulu dan pastikan masa magang telah selesai.")
			return
		}
	}

	// Untuk akun peserta: lepas relasi ke pendaftaran (bukan menghapus riwayat pendaftarannya).
	// Ini memungkinkan admin membuat akun baru lagi nanti untuk peserta yang sama jika diperlukan.
	if user.Role == "peserta" {
		config.DB.Model(&models.PendaftaranMagang{}).Where("akun_peserta_id = ?", user.ID).Update("akun_peserta_id", nil)
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus akun")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Akun berhasil dihapus", nil)
}

type UpdateUserManajemenInput struct {
	Nama               string `json:"nama" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	NoHp               string `json:"no_hp"`
	Jabatan            string `json:"jabatan"`
	KapasitasBimbingan int    `json:"kapasitas_bimbingan"`
}

// UpdateUserManajemen — admin mengedit data dasar akun (bukan password/role)
func UpdateUserManajemen(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}

	var input UpdateUserManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama dan email wajib diisi dengan benar")
		return
	}

	var existing models.UserManajemen
	if err := config.DB.Where("email = ? AND id != ?", input.Email, user.ID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email sudah dipakai akun lain")
		return
	}

	user.Nama = input.Nama
	user.Email = input.Email
	user.NoHp = input.NoHp
	user.Jabatan = input.Jabatan
	user.KapasitasBimbingan = input.KapasitasBimbingan

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui akun")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Akun berhasil diperbarui", user)
}

// UploadFotoUserManajemen — admin mengunggah/mengganti foto profil untuk akun (mis. mentor)
func UploadFotoUserManajemen(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}

	file, err := c.FormFile("foto_profil")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File foto tidak ditemukan")
		return
	}

	const maxFotoSize = 5 << 20 // 5MB
	if file.Size > maxFotoSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran foto maksimal 5MB")
		return
	}

	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("foto-user-%d-%d%s", user.ID, time.Now().UnixNano(), ext)
	savePath := filepath.Join("uploads", "foto-manajemen", fileName)

	if err := os.MkdirAll(filepath.Join("uploads", "foto-manajemen"), os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file foto")
		return
	}

	user.FotoProfil = savePath
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui foto akun")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Foto berhasil diunggah", gin.H{"foto_profil": user.FotoProfil})
}

// CekUserBisaDihapus — dipanggil frontend sebelum dialog konfirmasi hapus mentor
func CekUserBisaDihapus(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}

	bisaDihapus := true
	var alasan []string

	if user.Role == "mentor" {
		jumlahPeserta, namaPeserta := CekMentorMasihDipakai(user.ID)
		if jumlahPeserta > 0 {
			bisaDihapus = false
			alasan = append(alasan, fmt.Sprintf("masih membimbing %d peserta (%s)", jumlahPeserta, strings.Join(namaPeserta, ", ")))
		}
	}

	if user.Role == "peserta" {
		bisa, pesertaAlasan := CekPesertaBisaDihapus(user.ID)
		if !bisa {
			bisaDihapus = false
			alasan = append(alasan, pesertaAlasan...)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengecekan berhasil", gin.H{
		"bisa_dihapus": bisaDihapus,
		"alasan":       alasan,
	})
}