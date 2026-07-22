package controllers

import (
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"
	"unicode"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

const passwordCharset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

// ==== GANTI domain ini sesuai domain resmi instansi Anda ====
const loginEmailDomain = "magang.diskominfoponorogo.id"

func generateRandomPassword(length int) string {
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, length)
	for i := range b {
		b[i] = passwordCharset[rand.Intn(len(passwordCharset))]
	}
	return string(b)
}

// slugifyNama mengubah nama jadi bentuk aman untuk bagian depan email,
// contoh: "Budi Santoso" -> "budi.santoso"
func slugifyNama(nama string) string {
	var sb strings.Builder
	for _, r := range strings.ToLower(nama) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			sb.WriteRune(r)
		} else if r == ' ' {
			sb.WriteRune('.')
		}
	}
	slug := sb.String()
	if slug == "" {
		slug = "peserta"
	}
	return slug
}

// generateUniqueLoginEmail membuat email login otomatis berdasarkan nama peserta,
// dengan penanganan tabrakan (kalau nama yang sama sudah pernah dipakai sebelumnya).
func generateUniqueLoginEmail(nama string) string {
	base := slugifyNama(nama)
	rand.Seed(time.Now().UnixNano())

	candidate := fmt.Sprintf("%s@%s", base, loginEmailDomain)
	var existing models.UserManajemen

	for attempt := 0; attempt < 10; attempt++ {
		if err := config.DB.Where("email = ?", candidate).First(&existing).Error; err != nil {
			return candidate
		}
		suffix := rand.Intn(900) + 100
		candidate = fmt.Sprintf("%s%d@%s", base, suffix, loginEmailDomain)
	}

	return fmt.Sprintf("%s%d@%s", base, time.Now().UnixNano()%100000, loginEmailDomain)
}

// CreateAkunPeserta — dipanggil admin dari tabel Kelola Pendaftaran, setelah
// pendaftaran berstatus "diterima". Membuat akun UserManajemen role=peserta
// dengan EMAIL LOGIN yang dibuat otomatis oleh sistem (bukan email asli peserta),
// menautkannya ke PendaftaranMagang, dan mengirim kredensial ke EMAIL ASLI peserta
// (pendaftaran.Email) — email itulah yang juga dipakai untuk notifikasi selanjutnya.
func CreateAkunPeserta(c *gin.Context) {
	pendaftaranID := c.Param("id")

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.First(&pendaftaran, pendaftaranID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	if pendaftaran.StatusPendaftaran != "diterima" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun hanya bisa dibuat untuk pendaftaran yang sudah diterima")
		return
	}

	if pendaftaran.AkunPesertaID != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta ini sudah memiliki akun")
		return
	}

	loginEmail := generateUniqueLoginEmail(pendaftaran.NamaLengkap)
	plainPassword := generateRandomPassword(10)

	hashed, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengenkripsi password")
		return
	}

	user := models.UserManajemen{
		Nama:       pendaftaran.NamaLengkap,
		Email:      loginEmail,
		Password:   string(hashed),
		Role:       "peserta",
		StatusAkun: "aktif",
	}
	if err := config.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat akun peserta")
		return
	}

	pendaftaran.AkunPesertaID = &user.ID
	config.DB.Save(&pendaftaran)

	go func() {
		subject := emailtemplates.SubjectAkunPesertaDibuat()
		body := emailtemplates.TemplateAkunPesertaDibuat(pendaftaran.NamaLengkap, loginEmail, plainPassword)

		if err := services.SendEmail(pendaftaran.Email, subject, body); err != nil {
			fmt.Println("Gagal mengirim email akun peserta:", err)
		}
	}()

	utils.SuccessResponse(c, http.StatusCreated, "Akun peserta berhasil dibuat dan kredensial telah dikirim ke email", gin.H{
		"id":          user.ID,
		"nama":        user.Nama,
		"email_login": user.Email,
	})
}

// GetAllAkunPeserta — daftar semua akun manajemen dengan role=peserta,
// dilengkapi email asli (untuk notifikasi) dan info pendaftaran magang terkait.
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
		EmailLogin      string `json:"email_login"`
		EmailNotifikasi string `json:"email_notifikasi"`
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
		resp := PesertaResp{ID: u.ID, Nama: u.Nama, EmailLogin: u.Email, StatusAkun: u.StatusAkun, IsOnline: u.IsOnline}
		if p, ok := pendaftaranByAkun[u.ID]; ok {
			resp.EmailNotifikasi = p.Email
			resp.Bidang = p.PosisiBidang
			resp.TanggalMulai = p.TanggalMulai
			resp.TanggalSelesai = p.TanggalSelesai
			resp.PendaftaranID = p.ID
			resp.FotoProfil = p.FilePasFoto // foto yang dikirim peserta saat mendaftar
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
// lalu mengirimkannya ke email notifikasi (email asli) peserta tersebut.
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

	// Kirim notifikasi ke email ASLI peserta (bukan email login) setiap kali
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