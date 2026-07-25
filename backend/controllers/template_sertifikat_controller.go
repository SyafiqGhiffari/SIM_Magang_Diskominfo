package controllers

import (
	"encoding/json"
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

// ==================== TEMPLATE SERTIFIKAT (BANYAK TEMPLATE) ====================

// GetAllTemplateSertifikat — daftar semua template sertifikat.
func GetAllTemplateSertifikat(c *gin.Context) {
	var list []models.TemplateSertifikat
	if err := config.DB.Order("created_at desc").Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil daftar template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Daftar template berhasil diambil", list)
}

// GetTemplateSertifikat — ambil 1 template berdasarkan id.
func GetTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil diambil", t)
}

const maxTemplateFileSize = 10 << 20 // 10MB

// CreateTemplateSertifikat — buat template baru (multipart: metadata + background wajib).
func CreateTemplateSertifikat(c *gin.Context) {
	nama := strings.TrimSpace(c.PostForm("nama"))
	if nama == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Background template wajib diunggah")
		return
	}
	allowedExt := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".pdf": true}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Background harus PNG, JPG, JPEG, atau PDF")
		return
	}
	if file.Size > maxTemplateFileSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 10MB")
		return
	}

	uploadDir := filepath.Join("uploads", "sertifikat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}
	fileName := fmt.Sprintf("template-%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	tipe := "image"
	if ext == ".pdf" {
		tipe = "pdf"
	}
	orientasi := strings.TrimSpace(c.PostForm("orientasi"))
	if orientasi != "portrait" {
		orientasi = "landscape"
	}
	tempatTerbit := strings.TrimSpace(c.PostForm("tempat_terbit"))
	if tempatTerbit == "" {
		tempatTerbit = "Ponorogo"
	}

	jenisPeserta := strings.TrimSpace(c.PostForm("jenis_peserta"))
	if jenisPeserta != "mahasiswa" && jenisPeserta != "siswa" {
		jenisPeserta = "mahasiswa"
	}

	t := models.TemplateSertifikat{
		Nama:                 nama,
		Kategori:             strings.TrimSpace(c.PostForm("kategori")),
		JenisPeserta:         jenisPeserta,
		Bahasa:               "Indonesia",
		FileTemplate:         cleanPath,
		TipeTemplate:         tipe,
		Orientasi:            orientasi,
		NamaPenandatangan:    strings.TrimSpace(c.PostForm("nama_penandatangan")),
		JabatanPenandatangan: strings.TrimSpace(c.PostForm("jabatan_penandatangan")),
		TempatTerbit:         tempatTerbit,
		KonfigurasiField:     c.PostForm("konfigurasi_field"),
		Penandatangan:        c.PostForm("penandatangan"),
		Status:               "publish",
	}
	if err := config.DB.Create(&t).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat template")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template berhasil dibuat", t)
}

type UpdateTemplateSertifikatInput struct {
	Nama                 *string `json:"nama"`
	Kategori             *string `json:"kategori"`
	JenisPeserta         *string `json:"jenis_peserta"`
	Bahasa               *string `json:"bahasa"`
	Orientasi            *string `json:"orientasi"`
	NamaPenandatangan    *string `json:"nama_penandatangan"`
	JabatanPenandatangan *string `json:"jabatan_penandatangan"`
	TempatTerbit         *string `json:"tempat_terbit"`
	KonfigurasiField     *string `json:"konfigurasi_field"`
	Penandatangan        *string `json:"penandatangan"`
	Status               *string `json:"status"`
}

// UpdateTemplateSertifikat — update metadata + konfigurasi posisi field (JSON, partial).
func UpdateTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	var input UpdateTemplateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	if input.Nama != nil {
		n := strings.TrimSpace(*input.Nama)
		if n == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
			return
		}
		t.Nama = n
	}
	if input.Kategori != nil {
	t.Kategori = strings.TrimSpace(*input.Kategori)
	}
	if input.JenisPeserta != nil {
		jp := strings.TrimSpace(*input.JenisPeserta)
		if jp == "mahasiswa" || jp == "siswa" {
			t.JenisPeserta = jp
		}
	}
	if input.Bahasa != nil {
		t.Bahasa = strings.TrimSpace(*input.Bahasa)
	}
	if input.Orientasi != nil {
		o := strings.TrimSpace(*input.Orientasi)
		if o == "portrait" || o == "landscape" {
			t.Orientasi = o
		}
	}
	if input.NamaPenandatangan != nil {
		t.NamaPenandatangan = strings.TrimSpace(*input.NamaPenandatangan)
	}
	if input.JabatanPenandatangan != nil {
		t.JabatanPenandatangan = strings.TrimSpace(*input.JabatanPenandatangan)
	}
	if input.TempatTerbit != nil {
		t.TempatTerbit = strings.TrimSpace(*input.TempatTerbit)
	}
	if input.KonfigurasiField != nil {
	t.KonfigurasiField = *input.KonfigurasiField
	}
	if input.Penandatangan != nil {
		t.Penandatangan = *input.Penandatangan
	}
	if input.Status != nil {
		s := strings.TrimSpace(*input.Status)
		if s == "draft" || s == "publish" {
			t.Status = s
		}
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil disimpan", t)
}

// UploadFileTemplateSertifikat — upload/ganti background (template) / ttd / stempel untuk 1 template.
func UploadFileTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" && jenis != "logo" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}
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
	if file.Size > maxTemplateFileSize {
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
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = cleanPath
		if ext == ".pdf" {
			t.TipeTemplate = "pdf"
		} else {
			t.TipeTemplate = "image"
		}
	case "ttd":
	if pid := strings.TrimSpace(c.PostForm("penandatangan_id")); pid != "" {
		// Simpan path TTD ke entri penandatangan yang sesuai (dukungan >1 penandatangan)
		var list []map[string]interface{}
		_ = json.Unmarshal([]byte(t.Penandatangan), &list)
		found := false
		for i := range list {
			if fmt.Sprint(list[i]["id"]) == pid {
				if old, ok := list[i]["file_ttd"].(string); ok && old != "" {
					_ = os.Remove(old)
				}
				list[i]["file_ttd"] = cleanPath
				found = true
				break
			}
		}
		if !found {
			list = append(list, map[string]interface{}{"id": pid, "file_ttd": cleanPath})
		}
		b, _ := json.Marshal(list)
		t.Penandatangan = string(b)
	} else {
		// Kompatibilitas: TTD tunggal lama
		if t.FileTtd != "" {
			_ = os.Remove(t.FileTtd)
		}
		t.FileTtd = cleanPath
	}
	case "stempel":
	if t.FileStempel != "" {
		_ = os.Remove(t.FileStempel)
	}
	t.FileStempel = cleanPath
	case "logo":
		if t.FileLogo != "" {
			_ = os.Remove(t.FileLogo)
		}
		t.FileLogo = cleanPath
	}

	if err := config.DB.Save(&t).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"jenis": jenis,
		"path":  cleanPath,
		"url":   "/" + cleanPath,
		"tipe":  t.TipeTemplate,
	})
}

// DeleteFileTemplateSertifikat — hapus ttd / stempel (background sebaiknya diganti via upload, bukan dihapus).
func DeleteFileTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" && jenis != "logo" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	switch jenis {
	case "template":
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = ""
		t.TipeTemplate = ""
	case "ttd":
		if t.FileTtd != "" {
			_ = os.Remove(t.FileTtd)
		}
		t.FileTtd = ""
	case "stempel":
		if t.FileStempel != "" {
			_ = os.Remove(t.FileStempel)
		}
		t.FileStempel = ""
	case "logo":
		if t.FileLogo != "" {
			_ = os.Remove(t.FileLogo)
		}
		t.FileLogo = ""
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", t)
}

// DeleteTemplateSertifikat — hapus template beserta file-filenya.
func DeleteTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	if t.FileTemplate != "" {
		_ = os.Remove(t.FileTemplate)
	}
	if t.FileTtd != "" {
		_ = os.Remove(t.FileTtd)
	}
	if t.FileStempel != "" {
		_ = os.Remove(t.FileStempel)
	}
	if t.FileLogo != "" {
		_ = os.Remove(t.FileLogo)
	}

	if err := config.DB.Delete(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil dihapus", nil)
}