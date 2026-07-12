package controllers

import (
	crand "crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordInput struct {
	Email string `json:"email" binding:"required,email"`
}

func RequestForgotPassword(c *gin.Context) {
	var input ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alamat email tidak valid")
		return
	}

	var user models.UserPendaftaran
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// Demi keamanan, jangan bocorkan apakah email terdaftar atau tidak
		utils.SuccessResponse(c, http.StatusOK, "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam", nil)
		return
	}

	// ── RATE LIMITING: cegah spam request ──
	if user.ResetPasswordRequestedAt != nil {
		elapsed := time.Since(*user.ResetPasswordRequestedAt)
		if elapsed < 60*time.Second {
			sisaDetik := 60 - int(elapsed.Seconds())
			utils.ErrorResponse(c, http.StatusTooManyRequests, fmt.Sprintf("Mohon tunggu %d detik sebelum meminta ulang", sisaDetik))
			return
		}
	}

	token, err := generateResetToken()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat token reset")
		return
	}

	expiredAt := time.Now().Add(30 * time.Minute)
	now := time.Now()

	user.ResetPasswordToken = token
	user.ResetPasswordExpiredAt = &expiredAt
	user.ResetPasswordRequestedAt = &now
	user.ResetPasswordAttempt = 0

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses permintaan")
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // fallback default kalau env kosong
	}

	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)
	subject := "Permintaan Reset Password - SIM Magang Diskominfo"
	body := emailtemplates.ResetPasswordEmailTemplate(user.Nama, resetLink)

	if err := services.SendEmail(user.Email, subject, body); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email reset password")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam", nil)
}

type ResetPasswordInput struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

func ResetPassword(c *gin.Context) {
	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password baru wajib diisi minimal 6 karakter")
		return
	}
	if !isPasswordValid(input.NewPassword) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password harus mengandung minimal satu huruf dan satu angka")
		return
	}
	if input.NewPassword != input.ConfirmPassword {
		utils.ErrorResponse(c, http.StatusBadRequest, "Konfirmasi password tidak cocok")
		return
	}

	var user models.UserPendaftaran
	if err := config.DB.Where("reset_password_token = ?", input.Token).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token tidak valid atau sudah digunakan")
		return
	}

	if user.ResetPasswordExpiredAt == nil || time.Now().After(*user.ResetPasswordExpiredAt) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token sudah kedaluwarsa, silakan minta ulang")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password baru")
		return
	}

	user.Password = string(hashed)
	user.ResetPasswordToken = ""
	user.ResetPasswordExpiredAt = nil
	user.ResetPasswordAttempt = 0

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui password")
		return
	}

	// ── SIAPKAN DATA UNTUK NOTIFIKASI ──
	alamatIP := c.ClientIP()
	waktuSekarang := time.Now().Format("02 Jan 2006, 15:04")

	// ── NOTIFIKASI KE EMAIL USER ──
	go func(email, nama, ip, waktu string) {
		subject := "Password Anda Telah Diubah - SIM Magang Diskominfo"
		body := emailtemplates.NotifikasiPasswordDiubahTemplate(nama, ip, waktu)
		if err := services.SendEmail(email, subject, body); err != nil {
			log.Println("Gagal mengirim notifikasi reset password:", err)
		}
	}(user.Email, user.Nama, alamatIP, waktuSekarang)

	utils.SuccessResponse(c, http.StatusOK, "Password berhasil diubah, silakan masuk dengan password baru Anda", nil)
}

func generateResetToken() (string, error) {
	b := make([]byte, 32)
	if _, err := crand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}