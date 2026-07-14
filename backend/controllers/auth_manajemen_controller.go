package controllers

import (
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type RegisterManajemenInput struct {
	Nama     string `json:"nama" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"`
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
		Nama:       input.Nama,
		Email:      input.Email,
		Password:   string(hashedPassword),
		Role:       input.Role,
		StatusAkun: "aktif",
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

	type UserResp struct {
		ID         uint   `json:"id"`
		Nama       string `json:"nama"`
		Email      string `json:"email"`
		Role       string `json:"role"`
		StatusAkun string `json:"status_akun"`
		IsOnline   bool   `json:"is_online"`
	}

	var result []UserResp
	for _, u := range users {
		result = append(result, UserResp{
			ID: u.ID, Nama: u.Nama, Email: u.Email,
			Role: u.Role, StatusAkun: u.StatusAkun, IsOnline: u.IsOnline,
		})
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

	if err := config.DB.Delete(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus akun")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Akun berhasil dihapus", nil)
}