package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"regexp"
	"math/rand"
	"log"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"github.com/google/uuid"
)

type RegisterPendaftaranInput struct {
	Nama      string `json:"nama" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	NoHP      string `json:"no_hp"`
	Institusi string `json:"institusi" binding:"required"`
}

type LoginPendaftaranInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func isPasswordValid(password string) bool {
	hasLetter := regexp.MustCompile(`[a-zA-Z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	return hasLetter && hasNumber
}

func RegisterPendaftaran(c *gin.Context) {
	var input RegisterPendaftaranInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama, email, dan password wajib diisi dengan benar")
		return
	}
	if !isPasswordValid(input.Password) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password harus mengandung minimal satu huruf dan satu angka")
		return
	}
	var existingUser models.UserPendaftaran
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email sudah terdaftar")
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password")
		return
	}
	user := models.UserPendaftaran{
		Nama: input.Nama, Email: input.Email,
		Password: string(hashedPassword), NoHP: input.NoHP,
		Institusi: input.Institusi, StatusAkun: "aktif",
	}
	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat akun pendaftaran")
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Register pendaftaran berhasil", gin.H{
		"id": user.ID, "nama": user.Nama, "email": user.Email,
		"institusi": user.Institusi, "status_akun": user.StatusAkun,
	})
}

func LoginPendaftaran(c *gin.Context) {
	var input LoginPendaftaranInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email dan password wajib diisi")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Email atau password salah")
		return
	}
	if user.StatusAkun != "aktif" {
		utils.ErrorResponse(c, http.StatusForbidden, "Akun pendaftaran tidak aktif")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Email atau password salah")
		return
	}

	// ── TOLAK LOGIN kalau masih ada sesi aktif di device lain ──
	if user.CurrentSessionID != "" && user.SessionIssuedAt != nil {
		elapsed := time.Since(*user.SessionIssuedAt)
		if elapsed < 1*time.Hour {
			utils.ErrorResponse(c, http.StatusConflict, "Akun ini sedang aktif di perangkat/browser lain. Silakan logout dari perangkat tersebut terlebih dahulu.")
			return
		}
		// kalau sudah lewat 24 jam, sesi lama dianggap kadaluarsa — biarkan login lanjut
	}

	newSessionID := uuid.NewString()
	now := time.Now()
	user.CurrentSessionID = newSessionID
	user.SessionIssuedAt = &now
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses sesi login")
		return
	}

	token, err := services.GenerateToken(user.ID, user.Email, "pendaftar", "pendaftaran", newSessionID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat token")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Login pendaftaran berhasil", gin.H{
		"token": token,
		"user": gin.H{
			"id": user.ID, "nama": user.Nama, "email": user.Email,
			"no_hp": user.NoHP, "institusi": user.Institusi,
			"foto_profil": user.FotoProfil, "status_akun": user.StatusAkun,
		},
	})
}

func LogoutPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}
	user.CurrentSessionID = ""
	user.SessionIssuedAt = nil
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses logout")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Logout berhasil", nil)
}

func GetProfilPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Profil berhasil diambil", gin.H{
		"id": user.ID, "nama": user.Nama, "email": user.Email,
		"no_hp": user.NoHP, "institusi": user.Institusi, "foto_profil": user.FotoProfil,
		"status_akun": user.StatusAkun, "created_at": user.CreatedAt,
	})
}

type UpdateProfilInput struct {
	Nama      string `json:"nama" binding:"required"`
	NoHP      string `json:"no_hp"`
	Institusi string `json:"institusi"`
}

func UpdateProfilPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var input UpdateProfilInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama wajib diisi")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}
	user.Nama = input.Nama
	user.NoHP = input.NoHP
	user.Institusi = input.Institusi
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui profil")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Profil berhasil diperbarui", gin.H{
		"id": user.ID, "nama": user.Nama, "email": user.Email,
		"no_hp": user.NoHP, "institusi": user.Institusi,
		"foto_profil": user.FotoProfil, "status_akun": user.StatusAkun,
	})
}

func UploadFotoProfilPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	file, err := c.FormFile("foto_profil")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File foto_profil wajib diunggah")
		return
	}
	allowedExt := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format foto harus JPEG, JPG, atau PNG")
		return
	}
	if file.Size > 3*1024*1024 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran foto maksimal 3MB")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}
	uploadDir := filepath.Join("uploads", "foto_profil")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat folder upload")
		return
	}
	fileName := fmt.Sprintf("user_%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan foto profil")
		return
	}
	if user.FotoProfil != "" {
		_ = os.Remove(user.FotoProfil)
	}
	cleanPath := strings.ReplaceAll(filePath, "\\", "/")
	user.FotoProfil = cleanPath
	if err := config.DB.Save(&user).Error; err != nil {
		_ = os.Remove(filePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan path foto profil")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Foto profil berhasil diperbarui", gin.H{
		"foto_profil": cleanPath,
		"foto_url":    "/" + cleanPath,
	})
}

func HapusFotoProfilPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}
	if user.FotoProfil == "" {
		utils.SuccessResponse(c, http.StatusOK, "Tidak ada foto profil untuk dihapus", nil)
		return
	}
	// Hapus file fisik dari storage
	_ = os.Remove(user.FotoProfil)

	// Kosongkan referensi foto di database
	user.FotoProfil = ""
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus foto profil")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Foto profil berhasil dihapus", gin.H{
		"foto_profil": "",
	})
}

func generateOTP() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

type RequestGantiEmailInput struct {
	EmailBaru string `json:"email_baru" binding:"required,email"`
}

func RequestGantiEmail(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var input RequestGantiEmailInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alamat email tidak valid")
		return
	}

	var existing models.UserPendaftaran
	if err := config.DB.Where("email = ?", input.EmailBaru).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email sudah digunakan akun lain")
		return
	}

	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}

	// ── RATE LIMITING: cegah spam request OTP ──
	if user.OtpRequestedAt != nil {
		elapsed := time.Since(*user.OtpRequestedAt)
		if elapsed < 60*time.Second {
			sisaDetik := 60 - int(elapsed.Seconds())
			utils.ErrorResponse(c, http.StatusTooManyRequests, fmt.Sprintf("Mohon tunggu %d detik sebelum meminta OTP baru", sisaDetik))
			return
		}
	}

	otp := generateOTP()
	expiredAt := time.Now().Add(10 * time.Minute)
	now := time.Now()

	user.EmailBaru = input.EmailBaru
	user.OtpEmail = otp
	user.OtpEmailExpiredAt = &expiredAt
	user.OtpRequestedAt = &now

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses permintaan")
		return
	}

	subject := "Kode OTP Perubahan Email - SIM Magang Diskominfo"
	body := emailtemplates.OtpGantiEmailTemplate(user.Nama, otp)

	if err := services.SendEmail(input.EmailBaru, subject, body); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email OTP")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Kode OTP telah dikirim ke email baru Anda", nil)
}

type VerifikasiOTPEmailInput struct {
	Otp string `json:"otp" binding:"required"`
}

func VerifikasiGantiEmail(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	
	var input VerifikasiOTPEmailInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kode OTP wajib diisi")
		return
	}

	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}

	if user.EmailBaru == "" || user.OtpEmail == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tidak ada permintaan perubahan email yang aktif")
		return
	}
	if user.OtpEmailExpiredAt == nil || time.Now().After(*user.OtpEmailExpiredAt) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kode OTP sudah kedaluwarsa, silakan minta ulang")
		return
	}

	// ── BATASI PERCOBAAN GAGAL ──
	if user.OtpAttemptCount >= 5 {
		user.EmailBaru = ""
		user.OtpEmail = ""
		user.OtpEmailExpiredAt = nil
		user.OtpAttemptCount = 0
		config.DB.Save(&user)
		utils.ErrorResponse(c, http.StatusTooManyRequests, "Terlalu banyak percobaan gagal, silakan minta kode OTP baru")
		return
	}

	if user.OtpEmail != input.Otp {
		user.OtpAttemptCount++
		config.DB.Save(&user)
		sisaPercobaan := 5 - user.OtpAttemptCount
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Kode OTP tidak sesuai. Sisa percobaan: %d", sisaPercobaan))
		return
	}

	oldEmail := user.Email

	user.Email = user.EmailBaru
	user.EmailBaru = ""
	user.OtpEmail = ""
	user.OtpEmailExpiredAt = nil
	user.OtpAttemptCount = 0

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui email")
		return
	}

	// ── SIAPKAN DATA UNTUK NOTIFIKASI ──
	alamatIP := c.ClientIP()
	waktuSekarang := time.Now().Format("02 Jan 2006, 15:04")

	// ── NOTIFIKASI KE EMAIL LAMA ──
	go func(emailLama, emailBaruUser, namaUser, ip, waktu string) {
		subject := "Email Akun Anda Telah Diubah - SIM Magang Diskominfo"
		body := emailtemplates.NotifikasiEmailDiubahTemplate(namaUser, emailBaruUser, ip, waktu)
		if err := services.SendEmail(emailLama, subject, body); err != nil {
			log.Println("Gagal mengirim notifikasi email lama:", err)
		}
	}(oldEmail, user.Email, user.Nama, alamatIP, waktuSekarang)

	utils.SuccessResponse(c, http.StatusOK, "Email berhasil diperbarui", gin.H{
		"email": user.Email,
	})
}

type GantiPasswordInput struct {
	OldPassword     string `json:"oldPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

func GantiPasswordPendaftaran(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var input GantiPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password lama, baru, dan konfirmasi wajib diisi minimal 6 karakter")
		return
	}
	if input.NewPassword != input.ConfirmPassword {
		utils.ErrorResponse(c, http.StatusBadRequest, "Konfirmasi password tidak cocok")
		return
	}
	var user models.UserPendaftaran
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
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
