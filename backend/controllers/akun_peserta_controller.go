package controllers

import (
	"errors"
	"fmt"
	"math/rand"
	"mime/multipart"
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
	"golang.org/x/crypto/bcrypt"
)

const passwordCharset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

func generateRandomPassword(length int) string {
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, length)
	for i := range b {
		b[i] = passwordCharset[rand.Intn(len(passwordCharset))]
	}
	return string(b)
}

// CreateAkunPeserta — dipanggil admin dari tabel Kelola Pendaftaran sebagai fallback jika
// ada data pendaftaran diterima yang belum memiliki akun UserManajemen.
// Menggunakan email aktif pribadi peserta dan kata sandi dari pendaftaran.
func CreateAkunPeserta(c *gin.Context) {
	pendaftaranID := c.Param("id")

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Preload("UserPendaftaran").First(&pendaftaran, pendaftaranID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	if pendaftaran.StatusPendaftaran != "diterima" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun hanya bisa dibuat untuk pendaftaran yang sudah diterima")
		return
	}

	if pendaftaran.AkunPesertaID != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta ini sudah memiliki akun aktif")
		return
	}

	var user models.UserManajemen
	if err := config.DB.Where("email = ?", pendaftaran.Email).First(&user).Error; err == nil {
		pendaftaran.AkunPesertaID = &user.ID
		config.DB.Save(&pendaftaran)
	} else {
		passwordHash := pendaftaran.UserPendaftaran.Password
		if passwordHash == "" {
			plainPassword := generateRandomPassword(10)
			hashed, _ := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
			passwordHash = string(hashed)
		}

		user = models.UserManajemen{
			Nama:         pendaftaran.NamaLengkap,
			Email:        pendaftaran.Email,
			Password:     passwordHash,
			Role:         "peserta",
			StatusAkun:   "aktif",
			StatusMagang: "aktif",
			NoHp:         pendaftaran.NomorHP,
			FotoProfil:   pendaftaran.FilePasFoto,
		}
		if err := config.DB.Create(&user).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat akun peserta")
			return
		}

		pendaftaran.AkunPesertaID = &user.ID
		config.DB.Save(&pendaftaran)
	}

	go func() {
		subject := emailtemplates.SubjectAkunPesertaDibuat()
		body := emailtemplates.TemplateAkunPesertaDibuat(
			pendaftaran.NamaLengkap,
			pendaftaran.Email,
			"Gunakan kata sandi akun pendaftaran Anda",
		)

		if err := services.SendEmail(pendaftaran.Email, subject, body); err != nil {
			fmt.Println("Gagal mengirim email akun peserta:", err)
		}
	}()

	// Notifikasi in-app: peserta baru belum punya mentor pembimbing
	if pendaftaran.MentorID == nil {
		go services.KirimNotifikasiAdmin(
			"mentor_belum_ditugaskan",
			"Mentor belum ditugaskan",
			fmt.Sprintf("Akun %s sudah aktif, tetapi mentor pembimbing belum ditentukan.", pendaftaran.NamaLengkap),
			"pendaftaran_magangs", &pendaftaran.ID,
			"/admin/peserta",
			"tinggi", true,
		)
	}

	utils.SuccessResponse(c, http.StatusCreated, "Akun peserta berhasil diaktifkan dan notifikasi telah dikirim ke email", gin.H{
		"id":    user.ID,
		"nama":  user.Nama,
		"email": user.Email,
	})
}

// GetAllAkunPeserta — daftar semua akun manajemen dengan role=peserta,
// dilengkapi info pendaftaran magang dan mentor pembimbing terkait.
func GetAllAkunPeserta(c *gin.Context) {
	var users []models.UserManajemen
	if err := config.DB.Where("role = ?", "peserta").Order("created_at desc").Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data akun peserta")
		return
	}

	var pendaftaranList []models.PendaftaranMagang
	config.DB.Preload("Mentor").Where("akun_peserta_id IS NOT NULL").Find(&pendaftaranList)
	pendaftaranByAkun := map[uint]models.PendaftaranMagang{}
	for _, p := range pendaftaranList {
		if p.AkunPesertaID != nil {
			pendaftaranByAkun[*p.AkunPesertaID] = p
		}
	}

	type PesertaResp struct {
		ID              uint   `json:"id"`
		Nama            string `json:"nama"`
		Email           string `json:"email"`
		EmailLogin      string `json:"email_login"`      // Alias untuk kompatibilitas frontend
		EmailNotifikasi string `json:"email_notifikasi"` // Alias untuk kompatibilitas frontend
		StatusAkun      string `json:"status_akun"`
		IsOnline        bool   `json:"is_online"`
		Bidang          string `json:"bidang"`
		Institusi       string `json:"institusi"`
		TanggalMulai    string `json:"tanggal_mulai"`
		TanggalSelesai  string `json:"tanggal_selesai"`
		MentorID        *uint  `json:"mentor_id"`
		MentorNama      string `json:"mentor_nama"`
		PendaftaranID   uint   `json:"pendaftaran_id"`
		FotoProfil      string `json:"foto_profil"`
	}

	result := make([]PesertaResp, 0, len(users))
	for _, u := range users {
		emailDisplay := u.Email
		if p, ok := pendaftaranByAkun[u.ID]; ok && p.Email != "" {
			if strings.Contains(u.Email, "@magang.") || u.Email != p.Email {
				// Sinkronkan email lama jika belum bentrok
				var conflict models.UserManajemen
				if err := config.DB.Where("email = ? AND id != ?", p.Email, u.ID).First(&conflict).Error; err != nil {
					config.DB.Model(&u).Update("email", p.Email)
					emailDisplay = p.Email
				}
			}
		}

		resp := PesertaResp{
			ID:              u.ID,
			Nama:            u.Nama,
			Email:           emailDisplay,
			EmailLogin:      emailDisplay,
			EmailNotifikasi: emailDisplay,
			StatusAkun:      u.StatusAkun,
			IsOnline:        u.IsOnline,
		}
		if p, ok := pendaftaranByAkun[u.ID]; ok {
			resp.Bidang = p.PosisiBidang
			resp.TanggalMulai = p.TanggalMulai
			resp.TanggalSelesai = p.TanggalSelesai
			resp.PendaftaranID = p.ID
			resp.FotoProfil = p.FilePasFoto
			if p.KategoriPendaftar == "mahasiswa" {
				resp.Institusi = p.AsalKampus
			} else {
				resp.Institusi = p.AsalSekolah
			}
			if p.Mentor != nil {
				resp.MentorID = &p.Mentor.ID
				resp.MentorNama = p.Mentor.Nama
			}
		}
		result = append(result, resp)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data akun peserta berhasil diambil", result)
}

// ResetPasswordAkunPeserta — admin membuat ulang password acak untuk akun peserta,
// lalu mengirimkannya ke email aktif peserta tersebut.
func ResetPasswordAkunPeserta(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}
	if user.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Reset password ini khusus untuk akun peserta")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran terkait akun ini tidak ditemukan")
		return
	}

	newPassword := generateRandomPassword(10)
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password")
		return
	}

	user.Password = string(hashed)
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui password")
		return
	}

	// Sinkronkan ke akun UserPendaftaran jika ada
	if pendaftaran.UserPendaftaranID > 0 {
		config.DB.Model(&models.UserPendaftaran{}).Where("id = ?", pendaftaran.UserPendaftaranID).Update("password", string(hashed))
	}

	go func() {
		subject := emailtemplates.SubjectResetPasswordPeserta()
		body := emailtemplates.TemplateResetPasswordPeserta(user.Nama, user.Email, newPassword)

		if err := services.SendEmail(pendaftaran.Email, subject, body); err != nil {
			fmt.Println("Gagal mengirim email reset password:", err)
		}
	}()

	utils.SuccessResponse(c, http.StatusOK, "Password berhasil direset dan dikirim ke email peserta", nil)
}

// GetDetailAkunPeserta — data lengkap satu akun peserta untuk modal Detail di
// halaman Kelola Peserta, digabung dari UserManajemen + PendaftaranMagang terkait.
func GetDetailAkunPeserta(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}
	if user.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun ini bukan akun peserta")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran terkait akun ini tidak ditemukan")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail akun peserta berhasil diambil", gin.H{
		"id":          user.ID,
		"nama":        user.Nama,
		"email_login": user.Email,
		"status_akun": user.StatusAkun,
		"is_online":   user.IsOnline,
		"foto_profil": user.FotoProfil,

		"pendaftaran": pendaftaran,
	})
}

type AssignMentorPesertaInput struct {
	MentorID *uint `json:"mentor_id"`
}

// AssignMentorPeserta — admin menetapkan mentor pembimbing untuk peserta tertentu.
// Mentor yang dipilih WAJIB berasal dari bidang yang sama dengan bidang peserta.
func AssignMentorPeserta(c *gin.Context) {
	userID := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}
	if user.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Penugasan mentor ini khusus untuk akun peserta")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran terkait akun ini tidak ditemukan")
		return
	}

	var input AssignMentorPesertaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	if input.MentorID != nil {
		var mentor models.UserManajemen
		if err := config.DB.First(&mentor, *input.MentorID).Error; err != nil {
			utils.ErrorResponse(c, http.StatusNotFound, "Mentor tidak ditemukan")
			return
		}
		if mentor.Role != "mentor" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Akun yang dipilih bukan mentor")
			return
		}
		if mentor.BidangID == nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Mentor ini belum ditugaskan ke bidang manapun")
			return
		}

		var bidangMentor models.BidangMagang
		if err := config.DB.First(&bidangMentor, *mentor.BidangID).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memvalidasi bidang mentor")
			return
		}

		if bidangMentor.Nama != pendaftaran.PosisiBidang {
			utils.ErrorResponse(c, http.StatusBadRequest, "Mentor yang dipilih harus berasal dari bidang yang sama dengan peserta")
			return
		}
	}

	pendaftaran.MentorID = input.MentorID
	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui mentor pembimbing")
		return
	}

	// Kirim notifikasi ke email peserta setiap kali
	// mentor pembimbing ditentukan/diganti, supaya peserta tahu siapa mentornya.
	if input.MentorID != nil {
		var mentorTerpilih models.UserManajemen
		if err := config.DB.First(&mentorTerpilih, *input.MentorID).Error; err == nil {
			go func() {
				subject := emailtemplates.SubjectMentorDitugaskan()
				body := emailtemplates.TemplateMentorDitugaskan(
					pendaftaran.NamaLengkap,
					mentorTerpilih.Nama,
					mentorTerpilih.Jabatan,
					pendaftaran.PosisiBidang,
				)
				if err := services.SendEmail(pendaftaran.Email, subject, body); err != nil {
					fmt.Println("Gagal mengirim email penugasan mentor:", err)
				}
			}()
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Mentor pembimbing berhasil diperbarui", nil)
}

// CekPesertaBisaDihapus — dipakai CekUserBisaDihapus & DeleteUserManajemen untuk
// memvalidasi akun peserta sebelum dihapus. Peserta tidak boleh dihapus selama
// akunnya masih aktif ATAU masa magangnya masih berjalan.
func CekPesertaBisaDihapus(userID uint) (bool, []string) {
	var alasan []string

	var user models.UserManajemen
	if err := config.DB.First(&user, userID).Error; err != nil {
		return false, []string{"akun tidak ditemukan"}
	}

	if user.StatusAkun == "aktif" {
		alasan = append(alasan, "akun masih berstatus aktif")
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", userID).First(&pendaftaran).Error; err == nil {
		mulai, err1 := time.Parse("2006-01-02", pendaftaran.TanggalMulai)
		selesai, err2 := time.Parse("2006-01-02", pendaftaran.TanggalSelesai)
		if err1 == nil && err2 == nil {
			today := time.Now()
			if !today.Before(mulai) && !today.After(selesai) {
				alasan = append(alasan, "peserta masih dalam masa magang yang sedang berjalan")
			}
		}
	}

	return len(alasan) == 0, alasan
}

// ── DOKUMEN BERKAS PROFIL / PENDAFTARAN PESERTA ─────────────────────────────

// simpanDokumenPeserta menyimpan berkas dokumen pendaftaran tambahan / perbaikan
func simpanDokumenPeserta(c *gin.Context, file *multipart.FileHeader, jenis string, pesertaID uint) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if jenis == "file_pas_foto" {
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			return "", errors.New("format pas foto harus berupa JPG, JPEG, atau PNG")
		}
		if file.Size > 3*1024*1024 {
			return "", errors.New("ukuran pas foto maksimal 3 MB")
		}
	} else {
		if ext != ".pdf" && ext != ".zip" && ext != ".rar" && ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			return "", errors.New("format berkas tidak didukung (harus PDF, gambar, atau ZIP)")
		}
		if file.Size > 10*1024*1024 {
			return "", errors.New("ukuran berkas maksimal 10 MB")
		}
	}

	uploadDir := filepath.Join("uploads", "dokumen-peserta", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan dokumen")
	}

	fileName := fmt.Sprintf("%s_%d_%d%s", jenis, pesertaID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas dokumen")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// UploadDokumenPeserta menangani pengunggahan dokumen lampiran dari profil akun peserta
func UploadDokumenPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	jenisDokumen := strings.TrimSpace(c.PostForm("jenis_dokumen"))
	if jenisDokumen == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis dokumen wajib ditentukan")
		return
	}

	allowedJenis := map[string]bool{
		"file_cv":              true,
		"file_surat_pengantar": true,
		"file_transkrip":       true,
		"file_portofolio":      true,
		"file_pas_foto":        true,
		"file_proposal_magang": true,
	}

	if !allowedJenis[jenisDokumen] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis dokumen tidak valid")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Berkas dokumen wajib diunggah")
		return
	}

	savedPath, errSave := simpanDokumenPeserta(c, file, jenisDokumen, pesertaID)
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errSave.Error())
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran).Error; err != nil {
		_ = os.Remove(savedPath)
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran magang tidak ditemukan")
		return
	}

	var oldFile string
	switch jenisDokumen {
	case "file_cv":
		oldFile = pendaftaran.FileCV
		pendaftaran.FileCV = savedPath
	case "file_surat_pengantar":
		oldFile = pendaftaran.FileSuratPengantar
		pendaftaran.FileSuratPengantar = savedPath
	case "file_transkrip":
		oldFile = pendaftaran.FileTranskrip
		pendaftaran.FileTranskrip = savedPath
	case "file_portofolio":
		oldFile = pendaftaran.FilePortofolio
		pendaftaran.FilePortofolio = savedPath
	case "file_pas_foto":
		oldFile = pendaftaran.FilePasFoto
		pendaftaran.FilePasFoto = savedPath
		// Jika user belum punya foto profil, sinkronkan
		var user models.UserManajemen
		if config.DB.First(&user, pesertaID).Error == nil && user.FotoProfil == "" {
			user.FotoProfil = savedPath
			config.DB.Save(&user)
		}
	case "file_proposal_magang":
		oldFile = pendaftaran.FileProposalMagang
		pendaftaran.FileProposalMagang = savedPath
	}

	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		_ = os.Remove(savedPath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan berkas dokumen ke database")
		return
	}

	// Hapus file dokumen lama dari server jika diperbarui
	if oldFile != "" && oldFile != savedPath {
		cleanOld := strings.TrimPrefix(strings.ReplaceAll(oldFile, "\\", "/"), "/")
		if strings.HasPrefix(cleanOld, "uploads/") && !strings.Contains(cleanOld, "..") {
			_ = os.Remove(cleanOld)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Dokumen berhasil diunggah", gin.H{
		"jenis_dokumen": jenisDokumen,
		"file_path":     savedPath,
	})
}