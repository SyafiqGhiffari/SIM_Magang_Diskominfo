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
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ==================== SERTIFIKAT ====================

// GetAllSertifikat — daftar semua peserta (akun manajemen role=peserta) beserta
// data pendaftaran magang terkait dan sertifikatnya (jika sudah dibuat).
func GetAllSertifikat(c *gin.Context) {
	var users []models.UserManajemen
	// Sertifikat harus tetap dapat dikelola & diunduh walau peserta sudah selesai magang (alumni) atau akunnya dinonaktifkan admin.
	if err := config.DB.Where("role = ?", "peserta").Order("created_at desc").Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta")
		return
	}

	// Peta pendaftaran per akun peserta
	var pendaftaranList []models.PendaftaranMagang
	config.DB.Where("akun_peserta_id IS NOT NULL").Find(&pendaftaranList)
	pendaftaranByAkun := map[uint]models.PendaftaranMagang{}
	for _, p := range pendaftaranList {
		if p.AkunPesertaID != nil {
			pendaftaranByAkun[*p.AkunPesertaID] = p
		}
	}

	// Peta sertifikat per akun peserta
	var sertifikatList []models.Sertifikat
	config.DB.Find(&sertifikatList)
	sertifikatByAkun := map[uint]models.Sertifikat{}
	for _, s := range sertifikatList {
		sertifikatByAkun[s.AkunPesertaID] = s
	}

	type Resp struct {
		AkunPesertaID  uint                      `json:"akun_peserta_id"`
		Nama           string                    `json:"nama"`
		Bidang         string                    `json:"bidang"`
		Institusi      string                    `json:"institusi"`
		TanggalMulai   string                    `json:"tanggal_mulai"`
		TanggalSelesai string                    `json:"tanggal_selesai"`
		Pendaftaran    *models.PendaftaranMagang `json:"pendaftaran"`
		Sertifikat     *models.Sertifikat        `json:"sertifikat"`
	}

	result := make([]Resp, 0, len(users))
	for _, u := range users {
		r := Resp{AkunPesertaID: u.ID, Nama: u.Nama}
		if p, ok := pendaftaranByAkun[u.ID]; ok {
			pCopy := p
			r.Pendaftaran = &pCopy
			r.Bidang = p.PosisiBidang
			r.TanggalMulai = p.TanggalMulai
			r.TanggalSelesai = p.TanggalSelesai
			if p.KategoriPendaftar == "mahasiswa" {
				r.Institusi = p.AsalKampus
			} else {
				r.Institusi = p.AsalSekolah
			}
		}
		if s, ok := sertifikatByAkun[u.ID]; ok {
			sCopy := s
			r.Sertifikat = &sCopy
		}
		result = append(result, r)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data sertifikat peserta berhasil diambil", result)
}

type CreateSertifikatInput struct {
	AkunPesertaID   uint   `json:"akun_peserta_id"`
	NomorSertifikat string `json:"nomor_sertifikat"`
}

// CreateSertifikat — admin membuat sertifikat untuk seorang peserta.
// Hanya nomor yang diinput admin; tanggal terbit otomatis, predikat menyusul.
func CreateSertifikat(c *gin.Context) {
	var input CreateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}
	if input.AkunPesertaID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta wajib dipilih")
		return
	}
	if strings.TrimSpace(input.NomorSertifikat) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor sertifikat wajib diisi")
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, input.AkunPesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun peserta tidak ditemukan")
		return
	}
	if user.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun yang dipilih bukan peserta")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran peserta tidak ditemukan")
		return
	}

	var existing models.Sertifikat
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta ini sudah memiliki sertifikat")
		return
	}

	// Tolak jika peserta masih dalam masa magang (periode belum berakhir)
	if pendaftaran.TanggalSelesai != "" {
		if selesai, err := time.Parse("2006-01-02", pendaftaran.TanggalSelesai); err == nil {
			today, _ := time.Parse("2006-01-02", time.Now().Format("2006-01-02"))
			if !selesai.Before(today) {
				utils.ErrorResponse(c, http.StatusBadRequest, "Peserta masih dalam masa magang, sertifikat belum bisa dibuat")
				return
			}
		}
	}

	sertifikat := models.Sertifikat{
		AkunPesertaID:   user.ID,
		NomorSertifikat: strings.TrimSpace(input.NomorSertifikat),
		TanggalTerbit:   time.Now().Format("2006-01-02"),
		Status:          "terbit",
	}
	if err := config.DB.Create(&sertifikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Sertifikat berhasil dibuat", sertifikat)
}

type UpdateSertifikatInput struct {
	NomorSertifikat string `json:"nomor_sertifikat"`
}

// UpdateSertifikat — admin mengubah nomor sertifikat.
func UpdateSertifikat(c *gin.Context) {
	id := c.Param("id")

	var sertifikat models.Sertifikat
	if err := config.DB.First(&sertifikat, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sertifikat tidak ditemukan")
		return
	}

	var input UpdateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}
	if strings.TrimSpace(input.NomorSertifikat) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor sertifikat wajib diisi")
		return
	}

	sertifikat.NomorSertifikat = strings.TrimSpace(input.NomorSertifikat)
	if err := config.DB.Save(&sertifikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Sertifikat berhasil diperbarui", sertifikat)
}

// DeleteSertifikat — admin menghapus sertifikat peserta.
func DeleteSertifikat(c *gin.Context) {
	id := c.Param("id")

	var sertifikat models.Sertifikat
	if err := config.DB.First(&sertifikat, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sertifikat tidak ditemukan")
		return
	}

	if sertifikat.FileSertifikat != "" {
		_ = os.Remove(sertifikat.FileSertifikat)
	}

	if err := config.DB.Delete(&sertifikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Sertifikat berhasil dihapus", nil)
}

// ==================== PENGATURAN (TEMPLATE) SERTIFIKAT ====================

func defaultPengaturanSertifikat() models.PengaturanSertifikat {
	return models.PengaturanSertifikat{
		TempatTerbit: "Ponorogo",
	}
}

func getOrSeedPengaturanSertifikat() (models.PengaturanSertifikat, error) {
	var p models.PengaturanSertifikat
	if err := config.DB.First(&p).Error; err != nil {
		p = defaultPengaturanSertifikat()
		if err2 := config.DB.Create(&p).Error; err2 != nil {
			return p, err2
		}
	}
	return p, nil
}

// GetPengaturanSertifikat — ambil pengaturan template (auto-seed jika kosong).
func GetPengaturanSertifikat(c *gin.Context) {
	p, err := getOrSeedPengaturanSertifikat()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan sertifikat")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Pengaturan sertifikat berhasil diambil", p)
}

type UpdatePengaturanSertifikatInput struct {
	TempatTerbit     *string `json:"tempat_terbit"`
	KonfigurasiField *string `json:"konfigurasi_field"`
}

// UpdatePengaturanSertifikat — simpan tempat terbit & konfigurasi posisi field.
func UpdatePengaturanSertifikat(c *gin.Context) {
	p, err := getOrSeedPengaturanSertifikat()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan sertifikat")
		return
	}

	var input UpdatePengaturanSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	if input.TempatTerbit != nil {
		p.TempatTerbit = strings.TrimSpace(*input.TempatTerbit)
	}
	if input.KonfigurasiField != nil {
		p.KonfigurasiField = *input.KonfigurasiField
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengaturan sertifikat berhasil disimpan", p)
}

// UploadFilePengaturanSertifikat — upload template / ttd / stempel (jenis via :jenis).
// - template : foto (PNG/JPG/JPEG) ATAU PDF, maks 10MB
// - ttd/stempel : gambar (PNG/JPG/JPEG), maks 10MB
func UploadFilePengaturanSertifikat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	p, err := getOrSeedPengaturanSertifikat()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan sertifikat")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}

	// Template boleh PDF; TTD/stempel hanya gambar
	allowedExt := map[string]bool{".png": true, ".jpg": true, ".jpeg": true}
	if jenis == "template" {
		allowedExt[".pdf"] = true
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		if jenis == "template" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Template harus PNG, JPG, JPEG, atau PDF")
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau JPEG")
		}
		return
	}

	const maxSize = 10 << 20 // 10MB
	if file.Size > maxSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 10MB")
		return
	}

	uploadDir := filepath.Join("uploads", "sertifikat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}

	fileName := fmt.Sprintf("%s-%d%s", jenis, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	switch jenis {
	case "template":
		if p.FileTemplate != "" {
			_ = os.Remove(p.FileTemplate)
		}
		p.FileTemplate = cleanPath
		if ext == ".pdf" {
			p.TipeTemplate = "pdf"
		} else {
			p.TipeTemplate = "image"
		}
	case "ttd":
		if p.FileTtd != "" {
			_ = os.Remove(p.FileTtd)
		}
		p.FileTtd = cleanPath
	case "stempel":
		if p.FileStempel != "" {
			_ = os.Remove(p.FileStempel)
		}
		p.FileStempel = cleanPath
	}

	if err := config.DB.Save(&p).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"jenis": jenis,
		"path":  cleanPath,
		"url":   "/" + cleanPath,
		"tipe":  p.TipeTemplate,
	})
}

// DeleteFilePengaturanSertifikat — hapus template / ttd / stempel yang sudah ada.
func DeleteFilePengaturanSertifikat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	p, err := getOrSeedPengaturanSertifikat()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan sertifikat")
		return
	}

	switch jenis {
	case "template":
		if p.FileTemplate != "" {
			_ = os.Remove(p.FileTemplate)
		}
		p.FileTemplate = ""
		p.TipeTemplate = ""
	case "ttd":
		if p.FileTtd != "" {
			_ = os.Remove(p.FileTtd)
		}
		p.FileTtd = ""
	case "stempel":
		if p.FileStempel != "" {
			_ = os.Remove(p.FileStempel)
		}
		p.FileStempel = ""
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", p)
}