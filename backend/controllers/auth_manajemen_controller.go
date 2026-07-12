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