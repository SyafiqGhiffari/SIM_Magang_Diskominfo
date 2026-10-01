package controllers

import (
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// simpanFileMateri menyimpan lampiran dokumen/modul ke uploads/materi-pembelajaran/YYYY-MM
func simpanFileMateri(c *gin.Context, file *multipart.FileHeader, mentorID uint) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".pdf":  true,
		".zip":  true,
		".rar":  true,
		".7z":   true,
		".docx": true,
		".doc":  true,
		".pptx": true,
		".ppt":  true,
		".xlsx": true,
		".xls":  true,
		".png":  true,
		".jpg":  true,
		".jpeg": true,
	}

	if !allowed[ext] {
		return "", errors.New("format berkas tidak didukung (harus PDF, PPT, DOC, XLS, ZIP, atau Gambar)")
	}

	if file.Size > 25*1024*1024 {
		return "", errors.New("ukuran berkas materi maksimal 25 MB")
	}

	uploadDir := filepath.Join("uploads", "materi-pembelajaran", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan materi")
	}

	fileName := fmt.Sprintf("materi_%d_%d%s", mentorID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas materi")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// ── 1. GET DAFTAR MATERI MENTOR ──────────────────────────────────────────────
func GetMateriMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var materiList []models.MateriPembelajaran
	err := config.DB.Model(&models.MateriPembelajaran{}).
		Preload("PesertaAkses").
		Where("mentor_id = ? OR dibuat_oleh_id = ?", mentorID, mentorID).
		Order("id desc").
		Find(&materiList).Error

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat daftar materi")
		return
	}

	// Kategori unik & hitungan statistik
	setKategori := make(map[string]int)
	totalSemuaBimbingan := 0
	totalSpesifik := 0

	for _, m := range materiList {
		if m.Kategori != "" {
			setKategori[m.Kategori]++
		}
		if m.TargetPeserta == "spesifik" {
			totalSpesifik++
		} else {
			totalSemuaBimbingan++
		}
	}

	// Gabungkan dengan master kategori dari tabel kategori_materis
	var masterKategori []models.KategoriMateri
	_ = config.DB.Where("mentor_id = ? OR mentor_id IS NULL", mentorID).
		Order("nama asc").
		Find(&masterKategori).Error

	for _, mk := range masterKategori {
		if _, exists := setKategori[mk.Nama]; !exists {
			setKategori[mk.Nama] = 0
		}
	}

	var daftarKategori []gin.H
	for kat, count := range setKategori {
		daftarKategori = append(daftarKategori, gin.H{
			"nama":  kat,
			"total": count,
		})
	}

	sort.Slice(daftarKategori, func(i, j int) bool {
		return strings.ToLower(daftarKategori[i]["nama"].(string)) < strings.ToLower(daftarKategori[j]["nama"].(string))
	})

	utils.SuccessResponse(c, http.StatusOK, "Daftar materi bimbingan berhasil dimuat", gin.H{
		"total_materi":           len(materiList),
		"total_semua_bimbingan": totalSemuaBimbingan,
		"total_spesifik":        totalSpesifik,
		"total_kategori":        len(daftarKategori),
		"kategori":              daftarKategori,
		"materi":                materiList,
	})
}

// ── GET DAFTAR KATEGORI MATERI MENTOR ────────────────────────────────────────
func GetKategoriMateri(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	// 1. Ambil master kategori dari database
	var masterKategori []models.KategoriMateri
	_ = config.DB.Where("mentor_id = ? OR mentor_id IS NULL", mentorID).
		Order("nama asc").
		Find(&masterKategori).Error

	// 2. Hitung jumlah modul per kategori dari materi aktif mentor
	var materiList []models.MateriPembelajaran
	_ = config.DB.Select("kategori").
		Where("mentor_id = ? OR dibuat_oleh_id = ?", mentorID, mentorID).
		Find(&materiList).Error

	counts := make(map[string]int)
	for _, m := range materiList {
		if m.Kategori != "" {
			counts[m.Kategori]++
		}
	}

	setKategori := make(map[string]int)
	for _, mk := range masterKategori {
		setKategori[mk.Nama] = counts[mk.Nama]
	}
	for kat, count := range counts {
		if _, exists := setKategori[kat]; !exists {
			setKategori[kat] = count
		}
	}

	var daftar []gin.H
	for nama, total := range setKategori {
		daftar = append(daftar, gin.H{
			"nama":  nama,
			"total": total,
		})
	}

	sort.Slice(daftar, func(i, j int) bool {
		return strings.ToLower(daftar[i]["nama"].(string)) < strings.ToLower(daftar[j]["nama"].(string))
	})

	utils.SuccessResponse(c, http.StatusOK, "Daftar kategori materi berhasil dimuat", daftar)
}

// ── SIMPAN KATEGORI MATERI BARU ──────────────────────────────────────────────
func CreateKategoriMateri(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var req struct {
		Nama      string `json:"nama" binding:"required"`
		Deskripsi string `json:"deskripsi"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama kategori modul wajib diisi")
		return
	}

	namaTrimmed := strings.TrimSpace(req.Nama)
	if namaTrimmed == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama kategori tidak boleh kosong")
		return
	}

	// Cek apakah kategori sudah pernah dibuat
	var existing models.KategoriMateri
	if err := config.DB.Where("(mentor_id = ? OR mentor_id IS NULL) AND LOWER(nama) = LOWER(?)", mentorID, strings.ToLower(namaTrimmed)).First(&existing).Error; err == nil {
		utils.SuccessResponse(c, http.StatusOK, "Kategori materi sudah tersedia", existing)
		return
	}

	kategoriBaru := models.KategoriMateri{
		Nama:      namaTrimmed,
		Deskripsi: strings.TrimSpace(req.Deskripsi),
		MentorID:  &mentorID,
	}

	if err := config.DB.Create(&kategoriBaru).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan kategori materi ke database")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Kategori materi berhasil disimpan ke database", kategoriBaru)
}

// ── 2. GET PESERTA BIMBINGAN KHUSUS FORM MATERI ──────────────────────────────
func GetPesertaBimbinganUntukMateri(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaranList []models.PendaftaranMagang
	err := config.DB.Preload("AkunPeserta").
		Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mentorID).
		Order("nama_lengkap asc").
		Find(&pendaftaranList).Error

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat peserta bimbingan")
		return
	}

	type PesertaItem struct {
		ID                uint   `json:"id"` // akun_peserta_id
		PendaftaranID     uint   `json:"pendaftaran_id"`
		Nama              string `json:"nama"`
		Email             string `json:"email"`
		KategoriPendaftar string `json:"kategori_pendaftar"` // "mahasiswa" | "siswa"
		Institusi         string `json:"institusi"`
		PosisiBidang      string `json:"posisi_bidang"`
		FotoProfil        string `json:"foto_profil"`
	}

	var hasil []PesertaItem
	sudahAda := make(map[uint]bool)

	for _, p := range pendaftaranList {
		if p.AkunPesertaID == nil || sudahAda[*p.AkunPesertaID] {
			continue
		}
		sudahAda[*p.AkunPesertaID] = true

		foto := ""
		if p.AkunPeserta != nil && p.AkunPeserta.FotoProfil != "" {
			foto = p.AkunPeserta.FotoProfil
		} else if p.FilePasFoto != "" {
			foto = p.FilePasFoto
		}

		institusi := p.AsalKampus
		if p.KategoriPendaftar == "siswa" && p.AsalSekolah != "" {
			institusi = p.AsalSekolah
		}

		hasil = append(hasil, PesertaItem{
			ID:                *p.AkunPesertaID,
			PendaftaranID:     p.ID,
			Nama:              p.NamaLengkap,
			Email:             p.Email,
			KategoriPendaftar: p.KategoriPendaftar,
			Institusi:         institusi,
			PosisiBidang:      p.PosisiBidang,
			FotoProfil:        foto,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar peserta bimbingan berhasil diambil", hasil)
}

// ── 3. TAMBAH MATERI BARU MENTOR ─────────────────────────────────────────────
func CreateMateriMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul"))
	kategori := strings.TrimSpace(c.PostForm("kategori"))
	deskripsi := strings.TrimSpace(c.PostForm("deskripsi"))
	tipeMedia := strings.TrimSpace(c.PostForm("tipe_media"))
	tautanEksternal := strings.TrimSpace(c.PostForm("tautan_eksternal"))
	targetPeserta := strings.TrimSpace(c.PostForm("target_peserta")) // "semua_bimbingan" atau "spesifik"
	targetJenjang := strings.TrimSpace(c.PostForm("target_jenjang")) // "semua" | "mahasiswa" | "siswa"
	if targetJenjang == "" {
		targetJenjang = "semua"
	}
	pesertaIDsRaw := c.PostFormArray("peserta_ids[]")
	if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_ids") != "" {
		pesertaIDsRaw = strings.Split(c.PostForm("peserta_ids"), ",")
	}

	if judul == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Judul materi wajib diisi")
		return
	}
	if kategori == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kategori materi wajib diisi")
		return
	}
	if tipeMedia == "" {
		tipeMedia = "dokumen"
	}
	if targetPeserta != "spesifik" {
		targetPeserta = "semua_bimbingan"
	}

	// Simpan file jika diunggah
	var fileMateri string
	fileHeader, _ := c.FormFile("file_materi")
	if fileHeader != nil {
		path, err := simpanFileMateri(c, fileHeader, mentorID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
			return
		}
		fileMateri = path
	}

	materi := models.MateriPembelajaran{
		Judul:           judul,
		Deskripsi:       deskripsi,
		Kategori:        kategori,
		PosisiBidang:    "semua",
		TargetPeserta:   targetPeserta,
		TargetJenjang:   targetJenjang,
		FileMateri:      fileMateri,
		TautanEksternal: tautanEksternal,
		TipeMedia:       tipeMedia,
		MentorID:        &mentorID,
		DibuatOlehID:    &mentorID,
	}

	if err := config.DB.Create(&materi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan materi pembelajaran")
		return
	}

	// Pastikan kategori tersimpan di master tabel kategori_materis
	if kategori != "" {
		var cek models.KategoriMateri
		if err := config.DB.Where("(mentor_id = ? OR mentor_id IS NULL) AND LOWER(nama) = LOWER(?)", mentorID, strings.ToLower(kategori)).First(&cek).Error; err != nil {
			_ = config.DB.Create(&models.KategoriMateri{
				Nama:     kategori,
				MentorID: &mentorID,
			}).Error
		}
	}

	// Jika target peserta spesifik, hubungkan relasi many-to-many
	var targetUserIDs []uint
	if targetPeserta == "spesifik" && len(pesertaIDsRaw) > 0 {
		var pesertaList []models.UserManajemen
		for _, rawID := range pesertaIDsRaw {
			idTrim := strings.TrimSpace(rawID)
			if idTrim == "" {
				continue
			}
			if pID, err := strconv.ParseUint(idTrim, 10, 64); err == nil {
				targetUserIDs = append(targetUserIDs, uint(pID))
			}
		}

		if len(targetUserIDs) > 0 {
			config.DB.Where("id IN ?", targetUserIDs).Find(&pesertaList)
			if len(pesertaList) > 0 {
				_ = config.DB.Model(&materi).Association("PesertaAkses").Append(&pesertaList)
			}
		}
	} else if targetPeserta == "semua_bimbingan" {
		// Dapatkan semua peserta bimbingan untuk kirim notifikasi
		var pendaftarans []models.PendaftaranMagang
		config.DB.Select("akun_peserta_id").
			Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mentorID).
			Find(&pendaftarans)
		for _, p := range pendaftarans {
			if p.AkunPesertaID != nil {
				targetUserIDs = append(targetUserIDs, *p.AkunPesertaID)
			}
		}
	}

	// Kirim notifikasi in-app ke peserta bimbingan yang bersangkutan
	go func(targetIDs []uint, judulMateri string, mID uint) {
		for _, uid := range targetIDs {
			uCopy := uid
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &uCopy,
				Tipe:         "materi_baru",
				Prioritas:    "normal",
				Judul:        "Modul Pembelajaran Baru",
				Pesan:        fmt.Sprintf("Mentor membagikan materi baru: \"%s\". Buka modul untuk mempelajarinya.", judulMateri),
				RefTabel:     "materi_pembelajarans",
				RefID:        &mID,
				UrlTujuan:    "/peserta/materi",
			})
		}
	}(targetUserIDs, judul, materi.ID)

	// Reload with relation
	config.DB.Preload("PesertaAkses").First(&materi, materi.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Materi pembelajaran berhasil dibuat", materi)
}

// ── 4. UPDATE MATERI MENTOR ──────────────────────────────────────────────────
func UpdateMateriMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	materiID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID materi tidak valid")
		return
	}

	var materi models.MateriPembelajaran
	if err := config.DB.Where("id = ? AND (mentor_id = ? OR dibuat_oleh_id = ?)", materiID, mentorID, mentorID).
		First(&materi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Materi tidak ditemukan atau Anda tidak memiliki akses")
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul"))
	kategori := strings.TrimSpace(c.PostForm("kategori"))
	deskripsi := strings.TrimSpace(c.PostForm("deskripsi"))
	tipeMedia := strings.TrimSpace(c.PostForm("tipe_media"))
	tautanEksternal := strings.TrimSpace(c.PostForm("tautan_eksternal"))
	targetPeserta := strings.TrimSpace(c.PostForm("target_peserta"))
	targetJenjang := strings.TrimSpace(c.PostForm("target_jenjang"))
	pesertaIDsRaw := c.PostFormArray("peserta_ids[]")
	if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_ids") != "" {
		pesertaIDsRaw = strings.Split(c.PostForm("peserta_ids"), ",")
	}

	if judul != "" {
		materi.Judul = judul
	}
	if kategori != "" {
		materi.Kategori = kategori
	}
	materi.Deskripsi = deskripsi
	if tipeMedia != "" {
		materi.TipeMedia = tipeMedia
	}
	materi.TautanEksternal = tautanEksternal
	if targetPeserta != "" {
		materi.TargetPeserta = targetPeserta
	}
	if targetJenjang != "" {
		materi.TargetJenjang = targetJenjang
	}

	// Cek upload berkas baru
	fileHeader, _ := c.FormFile("file_materi")
	if fileHeader != nil {
		path, err := simpanFileMateri(c, fileHeader, mentorID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
			return
		}
		// Hapus file lama jika ada
		if materi.FileMateri != "" {
			_ = os.Remove(materi.FileMateri)
		}
		materi.FileMateri = path
	}

	if err := config.DB.Save(&materi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui materi pembelajaran")
		return
	}

	// Pastikan kategori tersimpan di master tabel kategori_materis
	if materi.Kategori != "" {
		var cek models.KategoriMateri
		if err := config.DB.Where("(mentor_id = ? OR mentor_id IS NULL) AND LOWER(nama) = LOWER(?)", mentorID, strings.ToLower(materi.Kategori)).First(&cek).Error; err != nil {
			_ = config.DB.Create(&models.KategoriMateri{
				Nama:     materi.Kategori,
				MentorID: &mentorID,
			}).Error
		}
	}

	// Update asosiasi peserta akses
	if materi.TargetPeserta == "spesifik" {
		var targetUserIDs []uint
		for _, rawID := range pesertaIDsRaw {
			idTrim := strings.TrimSpace(rawID)
			if idTrim == "" {
				continue
			}
			if pID, err := strconv.ParseUint(idTrim, 10, 64); err == nil {
				targetUserIDs = append(targetUserIDs, uint(pID))
			}
		}

		var pesertaList []models.UserManajemen
		if len(targetUserIDs) > 0 {
			config.DB.Where("id IN ?", targetUserIDs).Find(&pesertaList)
		}
		_ = config.DB.Model(&materi).Association("PesertaAkses").Replace(&pesertaList)
	} else {
		// Jika beralih ke semua bimbingan, bersihkan asosiasi spesifik
		_ = config.DB.Model(&materi).Association("PesertaAkses").Clear()
	}

	config.DB.Preload("PesertaAkses").First(&materi, materi.ID)

	utils.SuccessResponse(c, http.StatusOK, "Materi pembelajaran berhasil diperbarui", materi)
}

// ── 5. HAPUS MATERI MENTOR ───────────────────────────────────────────────────
func DeleteMateriMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	materiID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID materi tidak valid")
		return
	}

	var materi models.MateriPembelajaran
	if err := config.DB.Where("id = ? AND (mentor_id = ? OR dibuat_oleh_id = ?)", materiID, mentorID, mentorID).
		First(&materi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Materi tidak ditemukan atau Anda tidak memiliki akses")
		return
	}

	// Hapus file fisik jika ada
	if materi.FileMateri != "" {
		_ = os.Remove(materi.FileMateri)
	}

	// Clear relasi pivot
	_ = config.DB.Model(&materi).Association("PesertaAkses").Clear()

	// Hapus baris dari tabel
	if err := config.DB.Delete(&materi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus materi pembelajaran")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Materi pembelajaran berhasil dihapus", nil)
}
