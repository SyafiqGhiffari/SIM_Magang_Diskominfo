// ==============================================================================
// CONTROLLER: MATERI CONTROLLER
// DESKRIPSI : Pengelolaan modul dan materi pembelajaran bimbingan magang.
//             Mencakup pembuatan materi, kategori, berkas lampiran, penentuan
//             target akses (semua/spesifik jenjang/peserta), serta akses baca peserta.
// ROLE TERKAIT: [ROLE: MENTOR], [ROLE: PESERTA]
// ==============================================================================

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

// ==============================================================================
// ── BAGIAN MENTOR: KELOLA MATERI PEMBELAJARAN ─────────────────────────────────
// ==============================================================================

// [ROLE: MENTOR]
// GetMateriMentor mengambil daftar seluruh modul/materi bimbingan yang telah dibuat oleh mentor yang sedang login.
// Endpoint: GET /api/manajemen/mentor/materi
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

	// Pastikan foto profil peserta akses terisi (fallback ke pas foto pendaftaran jika kosong)
	var allMateriUserIDs []uint
	for _, m := range materiList {
		for _, u := range m.PesertaAkses {
			allMateriUserIDs = append(allMateriUserIDs, u.ID)
		}
	}
	if len(allMateriUserIDs) > 0 {
		var pendaftaransFoto []struct {
			AkunPesertaID uint   `gorm:"column:akun_peserta_id"`
			FilePasFoto   string `gorm:"column:file_pas_foto"`
		}
		config.DB.Model(&models.PendaftaranMagang{}).
			Select("akun_peserta_id, file_pas_foto").
			Where("akun_peserta_id IN ? AND file_pas_foto != ''", allMateriUserIDs).
			Scan(&pendaftaransFoto)

		fotoMap := make(map[uint]string)
		for _, pf := range pendaftaransFoto {
			fotoMap[pf.AkunPesertaID] = pf.FilePasFoto
		}

		for i := range materiList {
			for j := range materiList[i].PesertaAkses {
				if materiList[i].PesertaAkses[j].FotoProfil == "" {
					if f, ok := fotoMap[materiList[i].PesertaAkses[j].ID]; ok {
						materiList[i].PesertaAkses[j].FotoProfil = f
					}
				}
			}
		}
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
		"total_materi":          len(materiList),
		"total_semua_bimbingan": totalSemuaBimbingan,
		"total_spesifik":       totalSpesifik,
		"total_kategori":       len(daftarKategori),
		"kategori":             daftarKategori,
		"materi":               materiList,
	})
}

// [ROLE: MENTOR]
// GetKategoriMateri mengambil daftar kategori materi bimbingan beserta jumlah modul aktif per kategori.
// Endpoint: GET /api/manajemen/mentor/materi/kategori
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

// [ROLE: MENTOR]
// CreateKategoriMateri menambahkan kategori modul materi pembelajaran baru untuk mentor.
// Endpoint: POST /api/manajemen/mentor/materi/kategori
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

// [ROLE: MENTOR]
// GetPesertaBimbinganUntukMateri mengambil daftar peserta bimbingan aktif untuk opsi pemilihan target spesifik saat membuat/mengedit materi.
// Endpoint: GET /api/manajemen/mentor/materi/peserta-bimbingan
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
	now := time.Now().Truncate(24 * time.Hour)

	for _, p := range pendaftaranList {
		if p.AkunPesertaID == nil || sudahAda[*p.AkunPesertaID] {
			continue
		}

		// Jangan tampilkan peserta yang sudah selesai magang atau akun nonaktif
		if p.AkunPeserta != nil {
			if p.AkunPeserta.StatusMagang == "selesai" || p.AkunPeserta.StatusAkun != "aktif" {
				continue
			}
		}
		if p.TanggalSelesai != "" {
			datePart := strings.Split(p.TanggalSelesai, "T")[0]
			if tSelesai, err := time.Parse("2006-01-02", datePart); err == nil {
				if now.After(tSelesai) {
					continue
				}
			}
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

// [ROLE: MENTOR]
// CreateMateriMentor membuat modul materi pembelajaran baru, mengunggah lampiran dokumen/modul, dan mengirimkan notifikasi in-app ke peserta bimbingan.
// Endpoint: POST /api/manajemen/mentor/materi
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
		// Dapatkan semua peserta bimbingan aktif untuk kirim notifikasi (tidak kirim ke alumni)
		hariIni := utils.TanggalHariIni()
		var pendaftarans []models.PendaftaranMagang
		q := config.DB.
			Joins("JOIN user_manajemens u ON u.id = pendaftaran_magangs.akun_peserta_id").
			Where("pendaftaran_magangs.mentor_id = ? AND pendaftaran_magangs.status_pendaftaran = 'diterima' AND pendaftaran_magangs.akun_peserta_id IS NOT NULL", mentorID).
			Where("u.status_magang = 'aktif' AND u.status_akun = 'aktif'").
			Where("pendaftaran_magangs.tanggal_selesai IS NULL OR DATE(pendaftaran_magangs.tanggal_selesai) >= ?", hariIni)

		if targetJenjang != "" && targetJenjang != "semua" {
			q = q.Where("LOWER(pendaftaran_magangs.kategori_pendaftar) = ?", strings.ToLower(targetJenjang))
		}
		q.Select("pendaftaran_magangs.akun_peserta_id").Find(&pendaftarans)
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
				UrlTujuan:    "/peserta/pembelajaran/materi",
			})
		}
	}(targetUserIDs, judul, materi.ID)

	// Reload with relation
	config.DB.Preload("PesertaAkses").First(&materi, materi.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Materi pembelajaran berhasil dibuat", materi)
}

// [ROLE: MENTOR]
// UpdateMateriMentor memperbarui informasi modul materi, mengganti berkas lampiran, dan menyesuaikan daftar peserta yang memiliki akses khusus.
// Endpoint: PUT /api/manajemen/mentor/materi/:id
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
	var targetUserIDs []uint
	if materi.TargetPeserta == "spesifik" {
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

	// Kirim notifikasi pembaruan materi ke peserta terkait
	go func(mID uint, judulMateri, targetP, targetJ string, specificIDs []uint, mntrID uint) {
		var recipientUserIDs []uint
		if targetP == "spesifik" && len(specificIDs) > 0 {
			recipientUserIDs = specificIDs
		} else {
			var pendaftarans []models.PendaftaranMagang
			q := config.DB.Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mntrID)
			if targetJ != "" && targetJ != "semua" {
				q = q.Where("kategori_pendaftar = ?", targetJ)
			}
			q.Find(&pendaftarans)
			for _, p := range pendaftarans {
				if p.AkunPesertaID != nil {
					recipientUserIDs = append(recipientUserIDs, *p.AkunPesertaID)
				}
			}
		}

		for _, uid := range recipientUserIDs {
			uCopy := uid
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &uCopy,
				Tipe:         "materi_baru",
				Prioritas:    "normal",
				Judul:        "Pembaruan Materi Pembelajaran",
				Pesan:        fmt.Sprintf("Mentor memperbarui materi \"%s\". Buka modul untuk melihat pembaruan materi.", judulMateri),
				RefTabel:     "materi_pembelajarans",
				RefID:        &mID,
				UrlTujuan:    "/peserta/pembelajaran/materi",
				Gabungkan:    true,
			})
		}
	}(materi.ID, materi.Judul, materi.TargetPeserta, materi.TargetJenjang, targetUserIDs, mentorID)

	utils.SuccessResponse(c, http.StatusOK, "Materi pembelajaran berhasil diperbarui", materi)
}

// [ROLE: MENTOR]
// DeleteMateriMentor menghapus modul materi bimbingan beserta berkas fisik lampirannya dari server.
// Endpoint: DELETE /api/manajemen/mentor/materi/:id
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

// ==============================================================================
// ── BAGIAN PESERTA: LIHAT & AKSES MATERI PEMBELAJARAN ─────────────────────────
// ==============================================================================

// [ROLE: PESERTA]
// GetMateriPeserta mengambil daftar seluruh materi pembelajaran yang diberikan oleh mentor pembimbing atau admin yang relevan dengan bidang dan jenjang peserta login.
// Endpoint: GET /api/manajemen/peserta/materi
func GetMateriPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran)

	bidang := pendaftaran.PosisiBidang

	var materiList []models.MateriPembelajaran
	q := config.DB.Model(&models.MateriPembelajaran{}).Preload("Mentor")

	jenjang := pendaftaran.KategoriPendaftar
	if pendaftaran.MentorID != nil {
		q = q.Where(
			"(mentor_id = ? AND ((target_peserta = 'semua_bimbingan' AND (target_jenjang = 'semua' OR target_jenjang = ? OR target_jenjang IS NULL OR target_jenjang = '')) OR id IN (SELECT materi_id FROM materi_peserta_akses WHERE peserta_id = ?))) OR (dibuat_oleh_id IN (SELECT id FROM user_manajemens WHERE role = 'admin'))",
			*pendaftaran.MentorID, jenjang, pesertaID,
		)
	} else {
		q = q.Where("dibuat_oleh_id IN (SELECT id FROM user_manajemens WHERE role = 'admin')")
	}

	if bidang != "" {
		q = q.Where("posisi_bidang = 'semua' OR posisi_bidang = ? OR mentor_id IS NOT NULL", bidang)
	}
	q.Order("id desc").Find(&materiList)

	// Kategori unik
	setKategori := make(map[string]bool)
	var daftarKategori []string
	for _, m := range materiList {
		if !setKategori[m.Kategori] && m.Kategori != "" {
			setKategori[m.Kategori] = true
			daftarKategori = append(daftarKategori, m.Kategori)
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar materi pembelajaran berhasil dimuat", gin.H{
		"bidang":       bidang,
		"kategori":     daftarKategori,
		"total_materi": len(materiList),
		"materi":       materiList,
	})
}
