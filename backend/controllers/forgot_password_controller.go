// ==============================================================================
// CONTROLLER: Forgot Password Controller
// DESKRIPSI: Menangani alur lupa kata sandi dan pengaturan ulang kata sandi (reset password)
//            via tautan token email yang aman, baik untuk portal pendaftaran publik maupun manajemen.
// ROLE TERKAIT: [ROLE: PUBLIK / PENDAFTAR] & [ROLE: SEMUA USER MANAJEMEN] (Admin, Mentor, Peserta)
// ==============================================================================

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

// [ROLE: PUBLIK / PENDAFTAR]
// RequestForgotPassword mengirimkan tautan token reset password aman ke alamat email calon peserta (berlaku 30 menit).
// Endpoint: POST /api/pendaftaran/forgot-password
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

	frontendURL := os.Getenv("FRONTEND_PENDAFTARAN_URL")
	if frontendURL == "" {
		frontendURL = os.Getenv("FRONTEND_URL")
	}
	if frontendURL == "" {
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
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email reset password")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam", nil)
}

type ResetPasswordInput struct {
	Token           string `json:"token" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// [ROLE: PUBLIK / PENDAFTAR]
// ResetPassword memvalidasi token dari email dan memperbarui kata sandi baru untuk akun calon peserta.
// Endpoint: POST /api/pendaftaran/reset-password
func ResetPassword(c *gin.Context) {
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
	now := time.Now()
	user.PasswordChangedAt = &now

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui password")
		return
	}

	// Sinkronkan ke akun UserManajemen jika ada peserta dengan email yang sama
	var akunPeserta models.UserManajemen
	if err := config.DB.Where("email = ? AND role = 'peserta'", user.Email).First(&akunPeserta).Error; err == nil {
		config.DB.Model(&akunPeserta).Updates(map[string]interface{}{
			"password":            string(hashed),
			"password_changed_at": &now,
		})
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

// ==============================================================================
// ── FORGOT & RESET PASSWORD MANAJEMEN (ADMIN, MENTOR, PESERTA) ───────────────
// ==============================================================================

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// RequestForgotPasswordManajemen menangani permintaan reset password untuk seluruh role akun portal manajemen via tautan email (berlaku 30 menit).
// Endpoint: POST /api/manajemen/forgot-password
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
		origin := c.GetHeader("Origin")
		if origin != "" {
			frontendURL = origin
		} else {
			frontendURL = "http://localhost:5173"
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

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// ResetPasswordManajemen mereset kata sandi baru akun manajemen dan otomatis mensinkronkan ke akun pendaftaran jika user adalah peserta magang.
// Endpoint: POST /api/manajemen/reset-password
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