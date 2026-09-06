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

// GetAllTemplateRapor mengambil semua daftar template rapor
func GetAllTemplateRapor(c *gin.Context) {
	var list []models.TemplateRapor
	if err := config.DB.Order("is_default desc, id desc").Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat daftar template rapor")
		return
	}

	// Jika masih kosong, buat 1 template bawaan otomatis
	if len(list) == 0 {
		tplDefault := models.TemplateRapor{
			Nama:                 "Template Standar Kedinasan Diskominfo",
			Keterangan:           "Format baku transkrip nilai magang resmi Diskominfo Ponorogo",
			Status:               "publish",
			IsDefault:            true,
			NamaPemerintah:       "PEMERINTAH KABUPATEN PONOROGO",
			NamaInstansi:         "DINAS KOMUNIKASI, INFORMATIKA DAN STATISTIK",
			AlamatInstansi:       "Jl. Ir. H. Juanda No. 195 Ponorogo, Jawa Timur 63419",
			Telepon:              "(0352) 481105",
			Laman:                "kominfo.ponorogo.go.id",
			PosEl:                "kominfo@ponorogo.go.id",
			JudulDokumen:         "TRANSKRIP NILAI HASIL MAGANG",
			FormatNomor:          "560/TRN-{nomor}/405.08/{tahun}",
			TempatTerbit:         "Ponorogo",
			TipePenandatangan:    "kepala_dinas",
			JabatanPenandatangan: "Kepala Dinas Komunikasi, Informatika dan Statistik",
			NamaPenandatangan:    "Drs. BAMBANG SUHENDRO, M.Si",
			PangkatPenandatangan: "Pembina Utama Muda",
			NipPenandatangan:     "19750812 200003 1 004",
			KonfigurasiTataLetak: `{"tampilkan_bobot":true,"tampilkan_qr":true,"tampilkan_catatan_mentor":true,"tampilkan_garis_kop":true,"tampilkan_foto_peserta":false}`,
		}
		_ = config.DB.Create(&tplDefault).Error
		list = append(list, tplDefault)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar template rapor berhasil dimuat", list)
}

// GetTemplateRapor mengambil 1 template rapor berdasarkan ID
func GetTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil dimuat", tpl)
}

// GetTemplateRaporAktif mengambil template rapor aktif (default) untuk proses generate PDF
func GetTemplateRaporAktif(c *gin.Context) {
	var tpl models.TemplateRapor
	if err := config.DB.Where("is_default = ? AND status = ?", true, "publish").First(&tpl).Error; err != nil {
		if errFirst := config.DB.Order("id asc").First(&tpl).Error; errFirst != nil {
			tpl = models.TemplateRapor{
				Nama:                 "Template Standar Kedinasan Diskominfo",
				JenisPeserta:         "semua",
				NamaPemerintah:       "PEMERINTAH KABUPATEN PONOROGO",
				NamaInstansi:         "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
				AlamatInstansi:       "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
				Telepon:              "Telepon 0352–3592999",
				JudulDokumen:         "TRANSKRIP NILAI HASIL MAGANG",
				FormatNomor:          "560/TRN-{nomor}/405.08/{tahun}",
				TempatTerbit:         "Ponorogo",
				TipePenandatangan:    "kepala_dinas",
				JabatanPenandatangan: "Kepala Dinas Komunikasi Informatika dan Statistik",
				NamaPenandatangan:    "Drs. BAMBANG SUHENDRO, M.Si",
				NipPenandatangan:     "19750812 200003 1 004",
				IsDefault:            true,
				Status:               "publish",
			}
		}
	}
	utils.SuccessResponse(c, http.StatusOK, "Template rapor aktif berhasil dimuat", tpl)
}

// CreateTemplateRapor membuat template rapor baru
func CreateTemplateRapor(c *gin.Context) {
	var input models.TemplateRapor
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data input tidak valid: "+err.Error())
		return
	}

	if strings.TrimSpace(input.Nama) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	if input.JenisPeserta == "" {
		input.JenisPeserta = "semua"
	}

	// Jika dijadikan default, nonaktifkan is_default pada template lain
	if input.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Where("id > 0").Update("is_default", false)
	}

	if err := config.DB.Create(&input).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat template rapor: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template rapor berhasil dibuat", input)
}

// UpdateTemplateRapor memperbarui template rapor
func UpdateTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	var input models.TemplateRapor
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data input tidak valid: "+err.Error())
		return
	}

	if strings.TrimSpace(input.Nama) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	if input.IsDefault && !tpl.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Where("id != ?", tpl.ID).Update("is_default", false)
	}

	tpl.Nama = input.Nama
	tpl.Keterangan = input.Keterangan
	if input.JenisPeserta != "" {
		tpl.JenisPeserta = input.JenisPeserta
	}
	tpl.Status = input.Status
	tpl.IsDefault = input.IsDefault
	tpl.NamaPemerintah = input.NamaPemerintah
	tpl.NamaInstansi = input.NamaInstansi
	tpl.AlamatInstansi = input.AlamatInstansi
	tpl.Telepon = input.Telepon
	tpl.Laman = input.Laman
	tpl.PosEl = input.PosEl
	tpl.JudulDokumen = input.JudulDokumen
	tpl.FormatNomor = input.FormatNomor
	tpl.TempatTerbit = input.TempatTerbit
	tpl.CatatanKaki = input.CatatanKaki
	tpl.TipePenandatangan = input.TipePenandatangan
	tpl.JabatanPenandatangan = input.JabatanPenandatangan
	tpl.NamaPenandatangan = input.NamaPenandatangan
	tpl.PangkatPenandatangan = input.PangkatPenandatangan
	tpl.NipPenandatangan = input.NipPenandatangan
	if input.KonfigurasiTataLetak != "" {
		tpl.KonfigurasiTataLetak = input.KonfigurasiTataLetak
	}

	if err := config.DB.Save(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui template rapor: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil diperbarui", tpl)
}

// DeleteTemplateRapor menghapus template rapor
func DeleteTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	// Hapus file aset jika ada
	for _, f := range []string{tpl.FileLogo, tpl.FileTtd, tpl.FileStempel} {
		if f != "" {
			_ = os.Remove(f)
		}
	}

	if err := config.DB.Delete(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus template rapor: "+err.Error())
		return
	}

	// Jika yang dihapus adalah default, jadikan template pertama sebagai default
	if tpl.IsDefault {
		config.DB.Model(&models.TemplateRapor{}).Order("id asc").Limit(1).Update("is_default", true)
	}

	utils.SuccessResponse(c, http.StatusOK, "Template rapor berhasil dihapus", nil)
}

// SetDefaultTemplateRapor menjadikan template tertentu sebagai default utama
func SetDefaultTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	config.DB.Model(&models.TemplateRapor{}).Where("id > 0").Update("is_default", false)
	tpl.IsDefault = true
	tpl.Status = "publish"
	config.DB.Save(&tpl)

	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Template '%s' berhasil dijadikan template utama", tpl.Nama), tpl)
}

// DuplikatTemplateRapor menduplikat template rapor
func DuplikatTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	duplikat := tpl
	duplikat.ID = 0
	duplikat.Nama = fmt.Sprintf("%s (Salinan)", tpl.Nama)
	duplikat.IsDefault = false
	duplikat.CreatedAt = time.Now()
	duplikat.UpdatedAt = time.Now()

	if err := config.DB.Create(&duplikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menduplikat template: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template rapor berhasil diduplikat", duplikat)
}

// UploadFileTemplateRapor mengunggah aset gambar (logo, ttd, stempel)
func UploadFileTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis") // "logo", "ttd", "stempel"

	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".svg": true}
	if !allowed[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, JPEG, atau SVG")
		return
	}

	uploadDir := filepath.Join("uploads", "rapor", jenis)
	_ = os.MkdirAll(uploadDir, os.ModePerm)

	fileName := fmt.Sprintf("tpl_%s_%d_%d%s", jenis, tpl.ID, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	if errSave := c.SaveUploadedFile(file, savePath); errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file aset: "+errSave.Error())
		return
	}

	switch jenis {
	case "logo":
		if tpl.FileLogo != "" {
			_ = os.Remove(tpl.FileLogo)
		}
		tpl.FileLogo = cleanPath
	case "ttd":
		if tpl.FileTtd != "" {
			_ = os.Remove(tpl.FileTtd)
		}
		tpl.FileTtd = cleanPath
	case "stempel":
		if tpl.FileStempel != "" {
			_ = os.Remove(tpl.FileStempel)
		}
		tpl.FileStempel = cleanPath
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis aset tidak dikenal")
		return
	}

	config.DB.Save(&tpl)
	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Aset %s berhasil diunggah", jenis), tpl)
}

// DeleteFileTemplateRapor menghapus file aset gambar
func DeleteFileTemplateRapor(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")

	var tpl models.TemplateRapor
	if err := config.DB.First(&tpl, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template rapor tidak ditemukan")
		return
	}

	switch jenis {
	case "logo":
		if tpl.FileLogo != "" {
			_ = os.Remove(tpl.FileLogo)
		}
		tpl.FileLogo = ""
	case "ttd":
		if tpl.FileTtd != "" {
			_ = os.Remove(tpl.FileTtd)
		}
		tpl.FileTtd = ""
	case "stempel":
		if tpl.FileStempel != "" {
			_ = os.Remove(tpl.FileStempel)
		}
		tpl.FileStempel = ""
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis aset tidak dikenal")
		return
	}

	config.DB.Save(&tpl)
	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Aset %s berhasil dihapus", jenis), tpl)
}
