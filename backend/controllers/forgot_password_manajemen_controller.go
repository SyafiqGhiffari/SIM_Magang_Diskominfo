package controllers

import (
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

// RequestForgotPasswordManajemen menangani permintaan reset password untuk semua role di portal manajemen (admin, mentor, peserta).
func RequestForgotPasswordManajemen(c *gin.Context) {
	var input ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alamat email tidak valid")
		return
	}

	var user models.UserManajemen
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		// Demi keamanan, jangan bocorkan apakah email terdaftar atau tidak
		utils.SuccessResponse(c, http.StatusOK, "Jika email terdaftar, tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.", nil)
		return
	}

	// Rate limiting: jeda 60 detik antar permintaan
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
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat token reset password")
		return
	}

	expiredAt := time.Now().Add(30 * time.Minute)
	now := time.Now()

	user.ResetPasswordToken = token
	user.ResetPasswordExpiredAt = &expiredAt
	user.ResetPasswordRequestedAt = &now
	user.ResetPasswordAttempt = 0

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses permintaan reset password")
		return
	}

	// Tentukan URL Frontend Manajemen
	frontendURL := os.Getenv("FRONTEND_MANAJEMEN_URL")
	if frontendURL == "" {
		// Coba baca dari header Origin / Referer kalau ada, atau default port 5174
		origin := c.GetHeader("Origin")
		if origin != "" {
			frontendURL = origin
		} else {
			frontendURL = "http://localhost:5174"
		}
	}

	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)
	subject := "Permintaan Reset Password - SIM Magang Diskominfo"
	body := emailtemplates.ResetPasswordEmailTemplate(user.Nama, resetLink)

	if err := services.SendEmail(user.Email, subject, body); err != nil {
		log.Println("Gagal mengirim email reset password ke", user.Email, ":", err)
		// Tetap return sukses agar tidak membocorkan masalah internal / email dummy
		utils.SuccessResponse(c, http.StatusOK, "Jika email terdaftar, tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.", nil)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.", nil)
}

// ResetPasswordManajemen mereset password baru di portal manajemen dan menyinkronkannya ke portal pendaftaran jika role peserta.
func ResetPasswordManajemen(c *gin.Context) {
	var input ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kata sandi baru wajib diisi minimal 8 karakter")
		return
	}
	if err := utils.ValidatePasswordStrength(input.NewPassword); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	if input.NewPassword != input.ConfirmPassword {
		utils.ErrorResponse(c, http.StatusBadRequest, "Konfirmasi kata sandi tidak cocok")
		return
	}

	var user models.UserManajemen
	if err := config.DB.Where("reset_password_token = ?", input.Token).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token reset password tidak valid atau sudah pernah digunakan")
		return
	}

	if user.ResetPasswordExpiredAt == nil || time.Now().After(*user.ResetPasswordExpiredAt) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token reset password sudah kedaluwarsa, silakan minta tautan baru")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi kata sandi baru")
		return
	}

	now := time.Now()
	user.Password = string(hashed)
	user.ResetPasswordToken = ""
	user.ResetPasswordExpiredAt = nil
	user.ResetPasswordAttempt = 0
	user.PasswordChangedAt = &now

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui kata sandi")
		return
	}

	// Jika role adalah peserta, sinkronkan juga ke UserPendaftaran dengan email yang sama
	if user.Role == "peserta" {
		var userPendaftaran models.UserPendaftaran
		if err := config.DB.Where("email = ?", user.Email).First(&userPendaftaran).Error; err == nil {
			config.DB.Model(&userPendaftaran).Updates(map[string]interface{}{
				"password":            string(hashed),
				"password_changed_at": &now,
			})
		}
	}

	// Kirim notifikasi keamanan bahwa password telah berhasil diubah
	alamatIP := c.ClientIP()
	waktuSekarang := time.Now().Format("02 Jan 2006, 15:04 WIB")

	go func(email, nama, ip, waktu string) {
		subject := "Kata Sandi Akun Anda Telah Diubah - SIM Magang Diskominfo"
		body := emailtemplates.NotifikasiPasswordDiubahTemplate(nama, ip, waktu)
		if err := services.SendEmail(email, subject, body); err != nil {
			log.Println("Gagal mengirim notifikasi perubahan password:", err)
		}
	}(user.Email, user.Nama, alamatIP, waktuSekarang)

	utils.SuccessResponse(c, http.StatusOK, "Kata sandi berhasil diubah! Silakan masuk menggunakan kata sandi baru Anda.", nil)
}
