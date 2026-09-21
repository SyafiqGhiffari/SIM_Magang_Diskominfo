package controllers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)
type RegisterManajemenInput struct {
	Nama               string `json:"nama" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required,min=6"`
	Role               string `json:"role" binding:"required"`
	NoHp               string `json:"no_hp"`
	Nip                string `json:"nip"`
	Jabatan            string `json:"jabatan"`
	KapasitasBimbingan int    `json:"kapasitas_bimbingan"`
	BidangID           *uint  `json:"bidang_id"`
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
		Nip:                input.Nip,
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

	newSessionID := uuid.NewString()
	now := time.Now()
	clientIP := c.ClientIP()

	token, err := services.GenerateToken(user.ID, user.Email, user.Role, "manajemen", newSessionID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat token")
		return
	}

	// Simpan sesi aktif, timestamp aktivitas, IP, dan status online
	config.DB.Model(&user).Updates(map[string]interface{}{
		"current_session_id": newSessionID,
		"last_activity_at":   &now,
		"last_login_at":      &now,
		"last_login_ip":      clientIP,
		"is_online":          true,
	})

	// Catat audit riwayat login ke database
	rawUserAgent := c.GetHeader("User-Agent")
	browserName, deviceName, isMobileDevice := parseUserAgent(rawUserAgent)

	loginHistory := models.UserLoginHistory{
		UserID:    user.ID,
		UserType:  "manajemen",
		SessionID: newSessionID,
		IPAddress: clientIP,
		UserAgent: rawUserAgent,
		Device:    deviceName,
		Browser:   browserName,
		IsMobile:  isMobileDevice,
		CreatedAt: now,
	}
	config.DB.Create(&loginHistory)

	utils.SuccessResponse(c, http.StatusOK, "Login manajemen berhasil", gin.H{
		"token": token,
		"user": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"role":          user.Role,
			"status_akun":   user.StatusAkun,
			"status_magang": user.StatusMagang,
		},
	})
}

// GetRiwayatLoginManajemen mengambil daftar riwayat login untuk akun manajemen / peserta
func GetRiwayatLoginManajemen(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	var histories []models.UserLoginHistory
	if err := config.DB.Where("user_id = ? AND user_type = ?", userID, "manajemen").
		Order("created_at desc").
		Limit(50).
		Find(&histories).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat riwayat login")
		return
	}

	// Jika riwayat manajemen masih sedikit (misalnya baru 1), cari juga riwayat pendaftaran terkait
	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err == nil {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err == nil && pendaftaran.UserPendaftaranID > 0 {
			var pendaftaranHistories []models.UserLoginHistory
			config.DB.Where("user_id = ? AND user_type = 'pendaftaran'", pendaftaran.UserPendaftaranID).
				Order("created_at desc").
				Limit(20).
				Find(&pendaftaranHistories)

			if len(pendaftaranHistories) > 0 {
				histories = append(histories, pendaftaranHistories...)
			}
		}
	}

	// Jika masih kosong, buat fallback dari data user saat ini
	if len(histories) == 0 {
		var user models.UserManajemen
		if err := config.DB.First(&user, userID).Error; err == nil {
			loginTime := user.CreatedAt
			if user.LastLoginAt != nil {
				loginTime = *user.LastLoginAt
			}
			rawUA := c.GetHeader("User-Agent")
			b, d, m := parseUserAgent(rawUA)
			dummyHist := models.UserLoginHistory{
				UserID:    user.ID,
				UserType:  "manajemen",
				SessionID: user.CurrentSessionID,
				IPAddress: user.LastLoginIP,
				UserAgent: rawUA,
				Device:    d,
				Browser:   b,
				IsMobile:  m,
				CreatedAt: loginTime,
			}
			config.DB.Create(&dummyHist)
			histories = append(histories, dummyHist)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Riwayat login berhasil diambil", histories)
}

// LogoutManajemen mengubah status admin menjadi offline dan menghapus session ID
func LogoutManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	// Set status offline dan kosongkan sesi
	config.DB.Model(&user).Updates(map[string]interface{}{
		"is_online":          false,
		"current_session_id": "",
	})

	utils.SuccessResponse(c, http.StatusOK, "Logout manajemen berhasil", nil)
}

// PingManajemen memperbarui waktu aktivitas sesi (keep-alive) saat pengguna tetap aktif
func PingManajemen(c *gin.Context) {
	userIDFloat, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak terautentikasi")
		return
	}
	userID := uint(userIDFloat.(float64))
	now := time.Now()

	config.DB.Model(&models.UserManajemen{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"last_activity_at": &now,
		"is_online":        true,
	})

	utils.SuccessResponse(c, http.StatusOK, "Sesi berhasil diperpanjang", gin.H{
		"last_activity_at": now,
	})
}

type GantiPasswordManajemenInput struct {
	OldPassword     string `json:"oldPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// GantiPasswordManajemen — user manajemen (admin/mentor/peserta) mengganti password sendiri
func GantiPasswordManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var input GantiPasswordManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kata sandi lama, baru, dan konfirmasi wajib diisi minimal 8 karakter")
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

	now := time.Now()
	user.Password = string(hashed)
	user.PasswordChangedAt = &now
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui password")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password berhasil diperbarui", gin.H{
		"password_changed_at": now,
	})
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
		Nip                string `json:"nip"`
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
			NoHp: u.NoHp, Nip: u.Nip, Jabatan: u.Jabatan, KapasitasBimbingan: u.KapasitasBimbingan,
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

	fotoProfilLama := user.FotoProfil

	if err := config.DB.Delete(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus akun")
		return
	}

	// Akun terhapus → foto profilnya tidak lagi direferensikan siapa pun
	hapusFileLama(fotoProfilLama)

	utils.SuccessResponse(c, http.StatusOK, "Akun berhasil dihapus", nil)
}

type UpdateUserManajemenInput struct {
	Nama               string `json:"nama" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	NoHp               string `json:"no_hp"`
	Nip                string `json:"nip"`
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
	user.Nip = input.Nip
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

	fotoLama := user.FotoProfil // simpan dulu sebelum ditimpa
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	user.FotoProfil = cleanPath
	if err := config.DB.Save(&user).Error; err != nil {
		_ = os.Remove(savePath) // rollback file baru
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui foto akun")
		return
	}

	// Hapus foto lama agar folder uploads tidak menumpuk
	gantiFile(fotoLama, cleanPath)

	utils.SuccessResponse(c, http.StatusOK, "Foto berhasil diunggah", gin.H{
		"foto_profil": user.FotoProfil,
		"foto_url":    "/" + cleanPath,
	})
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

// ────────────────────────────────────────────────────────────────
// AKUN SENDIRI (manajemen): profil lengkap & kelola foto profil sendiri
// ────────────────────────────────────────────────────────────────

// GetProfilManajemen — user manajemen yang sedang login melihat profil lengkapnya
func GetProfilManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	res := gin.H{
		"id":                  user.ID,
		"nama":                user.Nama,
		"email":               user.Email,
		"role":                user.Role,
		"no_hp":               user.NoHp,
		"nip":                 user.Nip,
		"jabatan":             user.Jabatan,
		"foto_profil":         user.FotoProfil,
		"status_akun":         user.StatusAkun,
		"status_magang":       user.StatusMagang,
		"is_online":           user.IsOnline,
		"password_changed_at": user.PasswordChangedAt,
		"created_at":          user.CreatedAt,
		"updated_at":          user.UpdatedAt,
	}

	// Jika role = peserta, sertakan pendaftaran magang terkait & data mentor
	if user.Role == "peserta" {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.
			Preload("Mentor").
			Preload("SuratPenerimaan").
			Where("akun_peserta_id = ?", user.ID).
			Order("id desc").
			First(&pendaftaran).Error; err == nil {
			res["pendaftaran"] = pendaftaran
		}
	} else if user.Role == "mentor" && user.BidangID != nil {
		var bidang models.BidangMagang
		if err := config.DB.First(&bidang, *user.BidangID).Error; err == nil {
			res["bidang"] = bidang
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Profil berhasil diambil", res)
}

// UploadFotoProfilManajemen — user manajemen mengganti foto profilnya sendiri
func UploadFotoProfilManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
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

	const maxFotoSize = 3 << 20 // 3MB
	if file.Size > maxFotoSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran foto maksimal 3MB")
		return
	}

	uploadDir := filepath.Join("uploads", "foto-manajemen")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}

	fileName := fmt.Sprintf("foto-user-%d-%d%s", user.ID, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file foto")
		return
	}

	// Hapus foto lama jika ada agar tidak menumpuk
	if user.FotoProfil != "" {
		_ = os.Remove(user.FotoProfil)
	}

	cleanPath := strings.ReplaceAll(savePath, "\\", "/")
	user.FotoProfil = cleanPath
	if err := config.DB.Save(&user).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui foto profil")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Foto profil berhasil diperbarui", gin.H{
		"foto_profil": cleanPath,
		"foto_url":    "/" + cleanPath,
	})
}

// HapusFotoProfilManajemen — user manajemen menghapus foto profilnya sendiri
func HapusFotoProfilManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	if user.FotoProfil == "" {
		utils.SuccessResponse(c, http.StatusOK, "Tidak ada foto profil untuk dihapus", gin.H{"foto_profil": ""})
		return
	}

	_ = os.Remove(user.FotoProfil)

	user.FotoProfil = ""
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus foto profil")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Foto profil berhasil dihapus", gin.H{"foto_profil": ""})
}

// UpdateProfilManajemen — user manajemen memperbarui informasi akunnya sendiri
func UpdateProfilManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User tidak ditemukan")
		return
	}

	var input struct {
		Nama           string `json:"nama"`
		Email          string `json:"email"`
		NoHp           string `json:"no_hp"`
		Nip            string `json:"nip"`
		Jabatan        string `json:"jabatan"`
		TempatLahir    string `json:"tempat_lahir"`
		TanggalLahir   string `json:"tanggal_lahir"`
		JenisKelamin   string `json:"jenis_kelamin"`
		AlamatLengkap  string `json:"alamat_lengkap"`
		NpmNim         string `json:"npm_nim"`
		Nisn           string `json:"nisn"`
		AsalKampus     string `json:"asal_kampus"`
		AsalSekolah    string `json:"asal_sekolah"`
		Fakultas       string `json:"fakultas"`
		Kelas          string `json:"kelas"`
		ProgramStudi   string `json:"program_studi"`
		JurusanSekolah string `json:"jurusan_sekolah"`
		Semester       string `json:"semester"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data tidak valid")
		return
	}

	// Bersihkan input
	input.Nama = strings.TrimSpace(input.Nama)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.NoHp = strings.TrimSpace(input.NoHp)
	input.Nip = strings.TrimSpace(input.Nip)
	input.Jabatan = strings.TrimSpace(input.Jabatan)
	input.TempatLahir = strings.TrimSpace(input.TempatLahir)
	input.TanggalLahir = strings.TrimSpace(input.TanggalLahir)
	if len(input.TanggalLahir) > 10 && strings.Contains(input.TanggalLahir, "T") {
		input.TanggalLahir = strings.Split(input.TanggalLahir, "T")[0]
	}
	input.JenisKelamin = strings.TrimSpace(input.JenisKelamin)
	input.AlamatLengkap = strings.TrimSpace(input.AlamatLengkap)
	input.NpmNim = strings.TrimSpace(input.NpmNim)
	input.Nisn = strings.TrimSpace(input.Nisn)
	input.AsalKampus = strings.TrimSpace(input.AsalKampus)
	input.AsalSekolah = strings.TrimSpace(input.AsalSekolah)
	input.Fakultas = strings.TrimSpace(input.Fakultas)
	input.Kelas = strings.TrimSpace(input.Kelas)
	input.ProgramStudi = strings.TrimSpace(input.ProgramStudi)
	input.JurusanSekolah = strings.TrimSpace(input.JurusanSekolah)
	input.Semester = strings.TrimSpace(input.Semester)

	// Validasi field wajib
	if input.Nama == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama lengkap wajib diisi")
		return
	}
	if input.Email == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email wajib diisi")
		return
	}

	// Pastikan email belum dipakai akun lain
	var count int64
	config.DB.Model(&models.UserManajemen{}).
		Where("email = ? AND id <> ?", input.Email, user.ID).
		Count(&count)
	if count > 0 {
		utils.ErrorResponse(c, http.StatusConflict, "Email sudah digunakan oleh akun lain")
		return
	}

	// Update field (NoHp & Jabatan boleh kosong = hapus)
	user.Nama = input.Nama
	user.Email = input.Email
	user.NoHp = input.NoHp
	user.Nip = input.Nip
	user.Jabatan = input.Jabatan

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui profil")
		return
	}

	// Jika role = peserta, sinkronkan juga data ke pendaftaran_magang
	if user.Role == "peserta" {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.Where("akun_peserta_id = ?", user.ID).Order("id desc").First(&pendaftaran).Error; err == nil {
			pendaftaran.NamaLengkap = input.Nama
			pendaftaran.Email = input.Email
			if input.NoHp != "" {
				pendaftaran.NomorHP = input.NoHp
			}
			if input.TempatLahir != "" {
				pendaftaran.TempatLahir = input.TempatLahir
			}
			if input.TanggalLahir != "" {
				pendaftaran.TanggalLahir = input.TanggalLahir
			}
			if input.JenisKelamin != "" {
				pendaftaran.JenisKelamin = input.JenisKelamin
			}
			if input.AlamatLengkap != "" {
				pendaftaran.AlamatLengkap = input.AlamatLengkap
			}
			if input.NpmNim != "" {
				pendaftaran.NpmNim = input.NpmNim
			}
			if input.Nisn != "" {
				pendaftaran.Nisn = input.Nisn
			}
			if input.AsalKampus != "" {
				pendaftaran.AsalKampus = input.AsalKampus
			}
			if input.AsalSekolah != "" {
				pendaftaran.AsalSekolah = input.AsalSekolah
			}
			if input.Fakultas != "" {
				pendaftaran.Fakultas = input.Fakultas
			}
			if input.Kelas != "" {
				pendaftaran.Kelas = input.Kelas
			}
			if input.ProgramStudi != "" {
				pendaftaran.ProgramStudi = input.ProgramStudi
			}
			if input.JurusanSekolah != "" {
				pendaftaran.JurusanSekolah = input.JurusanSekolah
			}
			if input.Semester != "" {
				pendaftaran.Semester = input.Semester
			}
			_ = config.DB.Save(&pendaftaran)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Informasi akun berhasil diperbarui", gin.H{
		"id":          user.ID,
		"nama":        user.Nama,
		"email":       user.Email,
		"role":        user.Role,
		"no_hp":       user.NoHp,
		"jabatan":     user.Jabatan,
		"foto_profil": user.FotoProfil,
		"status_akun": user.StatusAkun,
		"is_online":   user.IsOnline,
		"created_at":  user.CreatedAt,
	})
}

type RequestGantiEmailManajemenInput struct {
	EmailBaru string `json:"email_baru" binding:"required,email"`
}

func RequestGantiEmailManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	if userID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}
	var input RequestGantiEmailManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alamat email tidak valid")
		return
	}

	input.EmailBaru = strings.TrimSpace(strings.ToLower(input.EmailBaru))

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data user tidak ditemukan")
		return
	}

	currentEmail := user.Email
	if user.Role == "peserta" {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.Where("akun_peserta_id = ?", user.ID).Order("id desc").First(&pendaftaran).Error; err == nil && pendaftaran.Email != "" {
			currentEmail = pendaftaran.Email
		}
	}

	if strings.ToLower(currentEmail) == input.EmailBaru {
		utils.ErrorResponse(c, http.StatusBadRequest, "Email baru tidak boleh sama dengan email saat ini")
		return
	}

	// ── RATE LIMITING: 60 detik cooldown ──
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
	user.OtpAttemptCount = 0

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses permintaan")
		return
	}

	namaUser := user.Nama
	if user.Role == "peserta" {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.Where("akun_peserta_id = ?", user.ID).Order("id desc").First(&pendaftaran).Error; err == nil && pendaftaran.NamaLengkap != "" {
			namaUser = pendaftaran.NamaLengkap
		}
	}

	subject := "Kode OTP Perubahan Email Pribadi - SIM Magang Diskominfo"
	body := emailtemplates.OtpGantiEmailTemplate(namaUser, otp)

	if err := services.SendEmail(input.EmailBaru, subject, body); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email OTP")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Kode OTP telah dikirim ke email baru Anda", nil)
}

type VerifikasiOTPEmailManajemenInput struct {
	Otp string `json:"otp" binding:"required"`
}

func VerifikasiGantiEmailManajemen(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	if userID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	var input VerifikasiOTPEmailManajemenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kode OTP wajib diisi")
		return
	}

	var user models.UserManajemen
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
		_ = config.DB.Save(&user)
		utils.ErrorResponse(c, http.StatusTooManyRequests, "Terlalu banyak percobaan gagal, silakan minta kode OTP baru")
		return
	}

	if user.OtpEmail != strings.TrimSpace(input.Otp) {
		user.OtpAttemptCount++
		_ = config.DB.Save(&user)
		sisaPercobaan := 5 - user.OtpAttemptCount
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Kode OTP tidak sesuai. Sisa percobaan: %d", sisaPercobaan))
		return
	}

	newEmail := user.EmailBaru
	oldEmail := user.Email
	namaUser := user.Nama

	user.EmailBaru = ""
	user.OtpEmail = ""
	user.OtpEmailExpiredAt = nil
	user.OtpAttemptCount = 0

	// Jika role = peserta, yang diperbarui adalah Email Pribadi pada pendaftaran magang
	// Email akun login user_manajemen tetap dipertahankan
	if user.Role == "peserta" {
		var pendaftaran models.PendaftaranMagang
		if err := config.DB.Where("akun_peserta_id = ?", user.ID).Order("id desc").First(&pendaftaran).Error; err == nil {
			if pendaftaran.NamaLengkap != "" {
				namaUser = pendaftaran.NamaLengkap
			}
			if pendaftaran.Email != "" {
				oldEmail = pendaftaran.Email
			}
			pendaftaran.Email = newEmail
			_ = config.DB.Save(&pendaftaran)
		}
		var userPend models.UserPendaftaran
		if err := config.DB.Where("email = ?", oldEmail).First(&userPend).Error; err == nil {
			userPend.Email = newEmail
			_ = config.DB.Save(&userPend)
		}
	} else {
		user.Email = newEmail
	}

	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui email")
		return
	}

	// Kirim notifikasi konfirmasi ke email lama
	alamatIP := c.ClientIP()
	waktuSekarang := time.Now().Format("02 Jan 2006, 15:04")
	go func(emailLama, emailBaruUser, nama, ip, waktu string) {
		subject := "Email Pribadi Anda Telah Diubah - SIM Magang Diskominfo"
		body := emailtemplates.NotifikasiEmailDiubahTemplate(nama, emailBaruUser, ip, waktu)
		if err := services.SendEmail(emailLama, subject, body); err != nil {
			log.Println("Gagal mengirim notifikasi email lama:", err)
		}
	}(oldEmail, newEmail, namaUser, alamatIP, waktuSekarang)

	utils.SuccessResponse(c, http.StatusOK, "Email pribadi berhasil diperbarui", gin.H{
		"email": newEmail,
	})
}