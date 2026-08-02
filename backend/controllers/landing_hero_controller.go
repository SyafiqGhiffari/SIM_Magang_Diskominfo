package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

const maxSlideSize = 5 << 20 // 5 MB

// ==================== SEED ====================

// Diisi dengan gambar yang SEKARANG masih hardcoded di Hero.jsx,
// supaya tampilan landing page tidak berubah setelah fitur ini dipasang.
func seedHeroSlideJikaKosong() {
	var jumlah int64
	config.DB.Model(&models.LandingHeroSlide{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	bawaan := []models.LandingHeroSlide{
		{Judul: "Ruang Kerja Digital", Urutan: 1, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80"},
		{Judul: "Kolaborasi Tim", Urutan: 2, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80"},
		{Judul: "Suasana Kantor", Urutan: 3, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80"},
	}
	for i := range bawaan {
		config.DB.Create(&bawaan[i])
	}
}

// ==================== HELPER ====================

func simpanGambarSlide(c *gin.Context) (string, error, bool) {
	file, err := c.FormFile("file")
	if err != nil {
		return "", nil, false // tidak ada file diunggah — bukan error
	}

	if file.Size > maxSlideSize {
		return "", fmt.Errorf("Ukuran gambar maksimal 5 MB"), true
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !landingImageExt[ext] {
		return "", fmt.Errorf("Gambar harus berformat JPG, PNG, WEBP, atau SVG"), true
	}

	folder := "uploads/landing"
	if err := os.MkdirAll(folder, os.ModePerm); err != nil {
		return "", fmt.Errorf("Gagal menyiapkan folder penyimpanan"), true
	}

	namaFile := fmt.Sprintf("hero-%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.ToSlash(filepath.Join(folder, namaFile))

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", fmt.Errorf("Gagal menyimpan gambar"), true
	}
	return savePath, nil, true
}

func slideResponse(s models.LandingHeroSlide) gin.H {
	url := s.UrlGambar
	if s.FileGambar != "" {
		url = urlPublikBerkas(s.FileGambar)
	}
	return gin.H{
		"id":          s.ID,
		"judul":       s.Judul,
		"file_gambar": s.FileGambar,
		"url_gambar":  s.UrlGambar,
		"pratinjau":   url,
		"urutan":      s.Urutan,
		"is_active":   s.IsActive,
	}
}

// ==================== ENDPOINT ADMIN ====================

func GetHeroSlides(c *gin.Context) {
	seedHeroSlideJikaKosong()

	var slides []models.LandingHeroSlide
	if err := config.DB.Order("urutan asc, id asc").Find(&slides).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data slide")
		return
	}

	result := make([]gin.H, 0, len(slides))
	for _, s := range slides {
		result = append(result, slideResponse(s))
	}
	utils.SuccessResponse(c, http.StatusOK, "Data slide berhasil diambil", result)
}

// CreateHeroSlide menerima multipart/form-data:
// judul, urutan, is_active, url_gambar, file (opsional)
func CreateHeroSlide(c *gin.Context) {
	savePath, errFile, adaFile := simpanGambarSlide(c)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}

	urlLuar := strings.TrimSpace(c.PostForm("url_gambar"))
	if !adaFile && urlLuar == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Unggah gambar atau isi tautan gambar terlebih dahulu")
		return
	}

	urutan, _ := strconv.Atoi(c.PostForm("urutan"))

	slide := models.LandingHeroSlide{
		Judul:      strings.TrimSpace(c.PostForm("judul")),
		FileGambar: savePath,
		UrlGambar:  urlLuar,
		Urutan:     urutan,
		IsActive:   c.PostForm("is_active") != "false",
	}

	if err := config.DB.Create(&slide).Error; err != nil {
		if savePath != "" {
			os.Remove(savePath) // rollback file agar tidak jadi sampah
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menambahkan slide")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Slide berhasil ditambahkan", slideResponse(slide))
}

func UpdateHeroSlide(c *gin.Context) {
	var slide models.LandingHeroSlide
	if err := config.DB.First(&slide, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Slide tidak ditemukan")
		return
	}

	savePath, errFile, adaFile := simpanGambarSlide(c)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}

	fileLama := slide.FileGambar

	if adaFile {
		slide.FileGambar = savePath
		slide.UrlGambar = "" // file unggahan menggantikan tautan luar
	} else if v, ok := c.GetPostForm("url_gambar"); ok {
		urlLuar := strings.TrimSpace(v)
		if urlLuar != "" {
			slide.UrlGambar = urlLuar
			slide.FileGambar = "" // tautan luar menggantikan file unggahan
		}
	}

	if v, ok := c.GetPostForm("judul"); ok {
		slide.Judul = strings.TrimSpace(v)
	}
	if v, ok := c.GetPostForm("urutan"); ok {
		n, _ := strconv.Atoi(v)
		slide.Urutan = n
	}
	if v, ok := c.GetPostForm("is_active"); ok {
		slide.IsActive = v != "false"
	}

	if slide.FileGambar == "" && slide.UrlGambar == "" {
		if savePath != "" {
			os.Remove(savePath)
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "Slide harus memiliki gambar atau tautan gambar")
		return
	}

	if err := config.DB.Save(&slide).Error; err != nil {
		if savePath != "" {
			os.Remove(savePath)
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui slide")
		return
	}

	// Hapus file lama HANYA setelah DB berhasil tersimpan.
	if fileLama != "" && fileLama != slide.FileGambar {
		gantiFile(fileLama, slide.FileGambar)
	}

	utils.SuccessResponse(c, http.StatusOK, "Slide berhasil diperbarui", slideResponse(slide))
}

func DeleteHeroSlide(c *gin.Context) {
	var slide models.LandingHeroSlide
	if err := config.DB.First(&slide, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Slide tidak ditemukan")
		return
	}

	fileLama := slide.FileGambar

	if err := config.DB.Delete(&slide).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus slide")
		return
	}

	hapusFileLama(fileLama)

	utils.SuccessResponse(c, http.StatusOK, "Slide berhasil dihapus", nil)
}