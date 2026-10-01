package controllers

import (
	"errors"
	"fmt"
	"mime/multipart"
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

// simpanFileLampiranTugas menyimpan berkas lampiran instruksi/soal tugas ke uploads/tugas-magang/YYYY-MM
func simpanFileLampiranTugas(c *gin.Context, file *multipart.FileHeader, mentorID uint) (string, error) {
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
		return "", errors.New("ukuran berkas tugas maksimal 25 MB")
	}

	uploadDir := filepath.Join("uploads", "tugas-magang", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan tugas")
	}

	fileName := fmt.Sprintf("tugas_%d_%d%s", mentorID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas lampiran tugas")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// ── 1. GET DAFTAR TUGAS MENTOR ────────────────────────────────────────────────
func GetTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	// Pastikan tugas default ada
	pastikanTugasBawaan(&mentorID)

	// Ambil semua tugas milik mentor (atau tugas bawaan jika mentor_id null)
	var tugasList []models.TugasMagang
	err := config.DB.Model(&models.TugasMagang{}).
		Preload("Peserta").
		Preload("PesertaAkses").
		Where("mentor_id = ? OR mentor_id IS NULL", mentorID).
		Order("id desc").
		Find(&tugasList).Error

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat daftar penugasan mentor")
		return
	}

	// Ambil daftar peserta bimbingan aktif mentor ini untuk menghitung total target
	var mentees []models.PendaftaranMagang
	config.DB.Preload("AkunPeserta").
		Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mentorID).
		Find(&mentees)

	totalPesertaBimbingan := len(mentees)

	// Format data tugas dengan ringkasan progres pengumpulan
	type TugasMentorResponseItem struct {
		models.TugasMagang
		TargetPesertaInfo struct {
			Tipe        string `json:"tipe"` // "semua_bimbingan" | "mahasiswa" | "siswa" | "spesifik"
			TotalTarget int    `json:"total_target"`
			NamaPeserta string `json:"nama_peserta,omitempty"`
			FotoPeserta string `json:"foto_peserta,omitempty"`
		} `json:"target_peserta_info"`
		PengumpulanSummary struct {
			TotalMengumpulkan int      `json:"total_mengumpulkan"`
			MenungguReview    int      `json:"menunggu_review"`
			PerluRevisi       int      `json:"perlu_revisi"`
			SudahDinilai      int      `json:"sudah_dinilai"`
			BelumMengumpulkan int      `json:"belum_mengumpulkan"`
			TotalTuntas       int      `json:"total_tuntas"`
			TotalRemidi       int      `json:"total_remidi"`
			PersentaseKumpul  float64  `json:"persentase_kumpul"`
			RataRataNilai     *float64 `json:"rata_rata_nilai"`
		} `json:"pengumpulan_summary"`
		StatusDeadline string `json:"status_deadline"` // "aktif" | "mendekati" | "berakhir" | "tanpa_deadline"
		SisaHari       *int   `json:"sisa_hari"`
	}

	now := time.Now()
	var hasil []TugasMentorResponseItem

	totalTugasAktif := 0
	totalMenungguGlobal := 0
	totalRevisiGlobal := 0
	totalDinilaiGlobal := 0

	for _, t := range tugasList {
		var item TugasMentorResponseItem
		item.TugasMagang = t

		// 1. Tentukan target peserta (semua, mahasiswa, siswa, spesifik)
		if t.TargetPeserta == "spesifik" || len(t.PesertaAkses) > 0 || t.PesertaID != nil {
			item.TargetPesertaInfo.Tipe = "spesifik"
			if len(t.PesertaAkses) > 0 {
				item.TargetPesertaInfo.TotalTarget = len(t.PesertaAkses)
				item.TargetPesertaInfo.NamaPeserta = fmt.Sprintf("%d Peserta Terpilih", len(t.PesertaAkses))
				if len(t.PesertaAkses) == 1 {
					item.TargetPesertaInfo.NamaPeserta = t.PesertaAkses[0].Nama
					item.TargetPesertaInfo.FotoPeserta = t.PesertaAkses[0].FotoProfil
				}
			} else if t.PesertaID != nil {
				item.TargetPesertaInfo.TotalTarget = 1
				if t.Peserta != nil {
					item.TargetPesertaInfo.NamaPeserta = t.Peserta.Nama
					item.TargetPesertaInfo.FotoPeserta = t.Peserta.FotoProfil
				}
			}
		} else if t.TargetPeserta == "mahasiswa" || t.TargetJenjang == "mahasiswa" {
			item.TargetPesertaInfo.Tipe = "mahasiswa"
			countMhs := 0
			for _, m := range mentees {
				if strings.EqualFold(m.KategoriPendaftar, "mahasiswa") {
					countMhs++
				}
			}
			item.TargetPesertaInfo.TotalTarget = countMhs
			item.TargetPesertaInfo.NamaPeserta = "Khusus Mahasiswa"
		} else if t.TargetPeserta == "siswa" || t.TargetJenjang == "siswa" {
			item.TargetPesertaInfo.Tipe = "siswa"
			countSiswa := 0
			for _, m := range mentees {
				if strings.EqualFold(m.KategoriPendaftar, "siswa") {
					countSiswa++
				}
			}
			item.TargetPesertaInfo.TotalTarget = countSiswa
			item.TargetPesertaInfo.NamaPeserta = "Khusus Siswa"
		} else {
			item.TargetPesertaInfo.Tipe = "semua_bimbingan"
			if t.PosisiBidang != "" && t.PosisiBidang != "semua" {
				countBidang := 0
				for _, m := range mentees {
					if strings.EqualFold(m.PosisiBidang, t.PosisiBidang) {
						countBidang++
					}
				}
				item.TargetPesertaInfo.TotalTarget = countBidang
			} else {
				item.TargetPesertaInfo.TotalTarget = totalPesertaBimbingan
			}
			item.TargetPesertaInfo.NamaPeserta = "Seluruh Peserta Bimbingan"
		}

		// 2. Query pengumpulan tugas
		var pengumpulan []models.PengumpulanTugas
		config.DB.Where("tugas_id = ?", t.ID).Find(&pengumpulan)

		totalKumpul := len(pengumpulan)
		menunggu := 0
		revisi := 0
		dinilai := 0
		totalTuntas := 0
		totalRemidi := 0
		var sumNilai float64 = 0
		countNilai := 0

		for _, p := range pengumpulan {
			switch p.StatusRemidi {
			case "tuntas":
				totalTuntas++
			case "perlu_remidi":
				totalRemidi++
			}

			switch p.Status {
			case "menunggu":
				menunggu++
				totalMenungguGlobal++
			case "revisi":
				revisi++
				totalRevisiGlobal++
			case "dinilai":
				dinilai++
				totalDinilaiGlobal++
				if p.Nilai != nil {
					sumNilai += *p.Nilai
					countNilai++
				}
			}
		}

		item.PengumpulanSummary.TotalMengumpulkan = totalKumpul
		item.PengumpulanSummary.MenungguReview = menunggu
		item.PengumpulanSummary.PerluRevisi = revisi
		item.PengumpulanSummary.SudahDinilai = dinilai
		item.PengumpulanSummary.TotalTuntas = totalTuntas
		item.PengumpulanSummary.TotalRemidi = totalRemidi

		target := item.TargetPesertaInfo.TotalTarget
		if target > 0 {
			belum := target - totalKumpul
			if belum < 0 {
				belum = 0
			}
			item.PengumpulanSummary.BelumMengumpulkan = belum
			persen := (float64(totalKumpul) / float64(target)) * 100
			if persen > 100 {
				persen = 100
			}
			item.PengumpulanSummary.PersentaseKumpul = persen
		} else {
			item.PengumpulanSummary.BelumMengumpulkan = 0
			item.PengumpulanSummary.PersentaseKumpul = 0
		}

		if countNilai > 0 {
			avg := sumNilai / float64(countNilai)
			item.PengumpulanSummary.RataRataNilai = &avg
		}

		// 3. Status deadline
		if t.TenggatWaktu != nil {
			diff := t.TenggatWaktu.Sub(now)
			days := int(diff.Hours() / 24)
			item.SisaHari = &days

			if now.After(*t.TenggatWaktu) {
				item.StatusDeadline = "berakhir"
			} else if diff.Hours() <= 48 {
				item.StatusDeadline = "mendekati"
				totalTugasAktif++
			} else {
				item.StatusDeadline = "aktif"
				totalTugasAktif++
			}
		} else {
			item.StatusDeadline = "tanpa_deadline"
			totalTugasAktif++
		}

		hasil = append(hasil, item)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar penugasan berhasil dimuat", gin.H{
		"tugas":             hasil,
		"total_tugas":       len(tugasList),
		"tugas_aktif":       totalTugasAktif,
		"menunggu_review":   totalMenungguGlobal,
		"perlu_revisi":      totalRevisiGlobal,
		"selesai_dinilai":   totalDinilaiGlobal,
		"total_bimbingan":   totalPesertaBimbingan,
	})
}

// ── 2. GET PESERTA BIMBINGAN UNTUK FORM PENUGASAN ─────────────────────────────
func GetPesertaBimbinganUntukTugas(c *gin.Context) {
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

	utils.SuccessResponse(c, http.StatusOK, "Peserta bimbingan berhasil dimuat", hasil)
}

// parseTenggatWaktu mem-parsing string tenggat waktu dari berbagai format umum
func parseTenggatWaktu(twStr string) (*time.Time, error) {
	twStr = strings.TrimSpace(twStr)
	if twStr == "" {
		return nil, nil
	}

	formats := []string{
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02",
	}

	for _, f := range formats {
		if parsed, err := time.ParseInLocation(f, twStr, utils.WIB()); err == nil {
			if f == "2006-01-02" {
				parsed = time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 23, 59, 59, 0, utils.WIB())
			}
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("format tenggat waktu '%s' tidak dikenali", twStr)
}

// ── 3. CREATE TUGAS MENTOR ────────────────────────────────────────────────────
func CreateTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul"))
	deskripsi := strings.TrimSpace(c.PostForm("deskripsi"))
	posisiBidang := strings.TrimSpace(c.PostForm("posisi_bidang"))
	if posisiBidang == "" {
		posisiBidang = "semua"
	}

	if judul == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Judul tugas wajib diisi")
		return
	}
	if deskripsi == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Deskripsi instruksi tugas wajib diisi")
		return
	}

	// Bobot nilai (default 100)
	bobotNilai := 100
	if bobotStr := c.PostForm("bobot_nilai"); bobotStr != "" {
		if b, err := strconv.Atoi(bobotStr); err == nil && b > 0 {
			bobotNilai = b
		}
	}

	// Tenggat waktu (opsional)
	var tenggatWaktu *time.Time
	if twStr := strings.TrimSpace(c.PostForm("tenggat_waktu")); twStr != "" {
		if parsed, err := parseTenggatWaktu(twStr); err == nil {
			tenggatWaktu = parsed
		}
	}

	// Tautan Eksternal (opsional)
	tautanEksternal := strings.TrimSpace(c.PostForm("tautan_eksternal"))

	// Target Peserta: "semua_bimbingan" | "mahasiswa" | "siswa" | "spesifik"
	targetPeserta := strings.TrimSpace(c.PostForm("target_peserta"))
	targetJenjang := strings.TrimSpace(c.PostForm("target_jenjang"))
	if targetPeserta == "" {
		if tt := strings.TrimSpace(c.PostForm("target_tipe")); tt != "" {
			targetPeserta = tt
		} else {
			targetPeserta = "semua_bimbingan"
		}
	}
	if targetJenjang == "" {
		if targetPeserta == "mahasiswa" || targetPeserta == "siswa" {
			targetJenjang = targetPeserta
		} else {
			targetJenjang = "semua"
		}
	}

	pesertaIDsRaw := c.PostFormArray("peserta_ids[]")
	if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_ids") != "" {
		pesertaIDsRaw = strings.Split(c.PostForm("peserta_ids"), ",")
	}
	if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_id") != "" {
		pesertaIDsRaw = []string{c.PostForm("peserta_id")}
	}

	var pesertaID *uint
	var targetUserIDs []uint
	if targetPeserta == "spesifik" && len(pesertaIDsRaw) > 0 {
		for _, rawID := range pesertaIDsRaw {
			idTrim := strings.TrimSpace(rawID)
			if idTrim == "" {
				continue
			}
			if pid, err := strconv.ParseUint(idTrim, 10, 32); err == nil && pid > 0 {
				targetUserIDs = append(targetUserIDs, uint(pid))
			}
		}
		if len(targetUserIDs) == 1 {
			pesertaID = &targetUserIDs[0]
		}
	}

	// File lampiran soal / aset panduan (opsional)
	file, _ := c.FormFile("file_lampiran")
	filePath, err := simpanFileLampiranTugas(c, file, mentorID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Tipe Tugas: "berkas" | "kuis"
	tipeTugas := strings.TrimSpace(c.PostForm("tipe_tugas"))
	if tipeTugas == "" {
		tipeTugas = "berkas"
	}
	kuisData := strings.TrimSpace(c.PostForm("kuis_data"))

	tugasBaru := models.TugasMagang{
		Judul:           judul,
		Deskripsi:       deskripsi,
		PosisiBidang:    posisiBidang,
		MentorID:        &mentorID,
		TargetPeserta:   targetPeserta,
		TargetJenjang:   targetJenjang,
		PesertaID:       pesertaID,
		FileLampiran:    filePath,
		TautanEksternal: tautanEksternal,
		TenggatWaktu:    tenggatWaktu,
		BobotNilai:      bobotNilai,
		TipeTugas:       tipeTugas,
		KuisData:        kuisData,
	}

	if err := config.DB.Create(&tugasBaru).Error; err != nil {
		if filePath != "" {
			os.Remove(filePath)
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat penugasan baru")
		return
	}

	// Hubungkan relasi many-to-many jika target spesifik
	if targetPeserta == "spesifik" && len(targetUserIDs) > 0 {
		var pesertaList []models.UserManajemen
		config.DB.Where("id IN ?", targetUserIDs).Find(&pesertaList)
		if len(pesertaList) > 0 {
			_ = config.DB.Model(&tugasBaru).Association("PesertaAkses").Append(&pesertaList)
		}
	}

	// Preload relasi
	config.DB.Preload("Peserta").Preload("PesertaAkses").Preload("Mentor").First(&tugasBaru, tugasBaru.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Tugas berhasil diterbitkan untuk peserta bimbingan", tugasBaru)
}

// ── 4. UPDATE TUGAS MENTOR ────────────────────────────────────────────────────
func UpdateTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	tugasID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID tugas tidak valid")
		return
	}

	var tugas models.TugasMagang
	if err := config.DB.Where("id = ? AND (mentor_id = ? OR mentor_id IS NULL)", tugasID, mentorID).First(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Tugas tidak ditemukan atau bukan milik Anda")
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul"))
	deskripsi := strings.TrimSpace(c.PostForm("deskripsi"))
	posisiBidang := strings.TrimSpace(c.PostForm("posisi_bidang"))

	if judul != "" {
		tugas.Judul = judul
	}
	if deskripsi != "" {
		tugas.Deskripsi = deskripsi
	}
	if posisiBidang != "" {
		tugas.PosisiBidang = posisiBidang
	}

	tugas.TautanEksternal = strings.TrimSpace(c.PostForm("tautan_eksternal"))

	if bobotStr := c.PostForm("bobot_nilai"); bobotStr != "" {
		if b, err := strconv.Atoi(bobotStr); err == nil && b > 0 {
			tugas.BobotNilai = b
		}
	}

	if twStr := strings.TrimSpace(c.PostForm("tenggat_waktu")); twStr != "" {
		if parsed, err := parseTenggatWaktu(twStr); err == nil {
			tugas.TenggatWaktu = parsed
		}
	} else if c.PostForm("hapus_tenggat_waktu") == "true" {
		tugas.TenggatWaktu = nil
		config.DB.Model(&models.TugasMagang{}).Where("id = ?", tugas.ID).Update("tenggat_waktu", nil)
	}

	// Update Target Peserta & Jenjang
	targetPeserta := strings.TrimSpace(c.PostForm("target_peserta"))
	if targetPeserta == "" {
		if tt := strings.TrimSpace(c.PostForm("target_tipe")); tt != "" {
			targetPeserta = tt
		}
	}
	if targetPeserta != "" {
		tugas.TargetPeserta = targetPeserta
	}
	if tj := strings.TrimSpace(c.PostForm("target_jenjang")); tj != "" {
		tugas.TargetJenjang = tj
	}

	if tugas.TargetPeserta == "spesifik" {
		pesertaIDsRaw := c.PostFormArray("peserta_ids[]")
		if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_ids") != "" {
			pesertaIDsRaw = strings.Split(c.PostForm("peserta_ids"), ",")
		}
		if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_id") != "" {
			pesertaIDsRaw = []string{c.PostForm("peserta_id")}
		}

		var targetUserIDs []uint
		for _, rawID := range pesertaIDsRaw {
			idTrim := strings.TrimSpace(rawID)
			if idTrim == "" {
				continue
			}
			if pid, err := strconv.ParseUint(idTrim, 10, 32); err == nil && pid > 0 {
				targetUserIDs = append(targetUserIDs, uint(pid))
			}
		}

		var pesertaList []models.UserManajemen
		if len(targetUserIDs) > 0 {
			config.DB.Where("id IN ?", targetUserIDs).Find(&pesertaList)
			if len(targetUserIDs) == 1 {
				tugas.PesertaID = &targetUserIDs[0]
			} else {
				tugas.PesertaID = nil
			}
		} else {
			tugas.PesertaID = nil
		}
		_ = config.DB.Model(&tugas).Association("PesertaAkses").Replace(&pesertaList)
	} else {
		tugas.PesertaID = nil
		_ = config.DB.Model(&tugas).Association("PesertaAkses").Clear()
	}

	// Update file lampiran baru jika ada
	file, _ := c.FormFile("file_lampiran")
	if file != nil {
		filePath, err := simpanFileLampiranTugas(c, file, mentorID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
			return
		}
		// Hapus file lama jika ada
		if tugas.FileLampiran != "" {
			os.Remove(tugas.FileLampiran)
		}
		tugas.FileLampiran = filePath
	}

	// Update tipe tugas & data kuis jika ada
	if tipeTugas := strings.TrimSpace(c.PostForm("tipe_tugas")); tipeTugas != "" {
		tugas.TipeTugas = tipeTugas
	}
	if kuisData := strings.TrimSpace(c.PostForm("kuis_data")); kuisData != "" || c.PostForm("update_kuis") == "true" {
		tugas.KuisData = kuisData
	}

	tugas.MentorID = &mentorID
	if err := config.DB.Save(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui penugasan")
		return
	}

	config.DB.Preload("Peserta").Preload("PesertaAkses").Preload("Mentor").First(&tugas, tugas.ID)
	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil diperbarui", tugas)
}

// ── 5. DELETE TUGAS MENTOR ────────────────────────────────────────────────────
func DeleteTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	tugasID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID tugas tidak valid")
		return
	}

	var tugas models.TugasMagang
	if err := config.DB.Where("id = ? AND (mentor_id = ? OR mentor_id IS NULL)", tugasID, mentorID).First(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Tugas tidak ditemukan atau bukan milik Anda")
		return
	}

	// Hapus file lampiran jika ada
	if tugas.FileLampiran != "" {
		os.Remove(tugas.FileLampiran)
	}

	// Hapus relasi many2many
	_ = config.DB.Model(&tugas).Association("PesertaAkses").Clear()

	// Hapus tugas (cascade akan menghapus pengumpulan tugas terkait)
	if err := config.DB.Delete(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus tugas")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil dihapus", nil)
}

// ── 6. GET DETAIL PENGUMPULAN TUGAS OLEH PESERTA ──────────────────────────────
func GetPengumpulanTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	tugasID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID tugas tidak valid")
		return
	}

	var tugas models.TugasMagang
	if err := config.DB.Preload("Peserta").Preload("PesertaAkses").
		Where("id = ? AND (mentor_id = ? OR mentor_id IS NULL)", tugasID, mentorID).
		First(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Tugas tidak ditemukan")
		return
	}

	// Ambil semua mentees yang relevan
	var mentees []models.PendaftaranMagang
	qMentee := config.DB.Preload("AkunPeserta").
		Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mentorID)
	if tugas.TargetPeserta == "spesifik" || len(tugas.PesertaAkses) > 0 {
		var ids []uint
		for _, p := range tugas.PesertaAkses {
			ids = append(ids, p.ID)
		}
		if len(ids) == 0 && tugas.PesertaID != nil {
			ids = append(ids, *tugas.PesertaID)
		}
		if len(ids) > 0 {
			qMentee = qMentee.Where("akun_peserta_id IN ?", ids)
		}
	} else if tugas.TargetPeserta == "mahasiswa" || tugas.TargetJenjang == "mahasiswa" {
		qMentee = qMentee.Where("LOWER(kategori_pendaftar) = 'mahasiswa'")
	} else if tugas.TargetPeserta == "siswa" || tugas.TargetJenjang == "siswa" {
		qMentee = qMentee.Where("LOWER(kategori_pendaftar) = 'siswa'")
	} else if tugas.PesertaID != nil {
		qMentee = qMentee.Where("akun_peserta_id = ?", *tugas.PesertaID)
	} else if tugas.PosisiBidang != "" && tugas.PosisiBidang != "semua" {
		qMentee = qMentee.Where("posisi_bidang = ?", tugas.PosisiBidang)
	}
	qMentee.Find(&mentees)

	// Ambil semua pengumpulan untuk tugas ini
	var pengumpulanList []models.PengumpulanTugas
	config.DB.Preload("Peserta").
		Where("tugas_id = ?", tugas.ID).
		Find(&pengumpulanList)

	mapKumpul := make(map[uint]models.PengumpulanTugas)
	for _, p := range pengumpulanList {
		mapKumpul[p.PesertaID] = p
	}

	type PesertaSubmissionItem struct {
		PesertaID         uint                    `json:"peserta_id"`
		Nama              string                  `json:"nama"`
		Email             string                  `json:"email"`
		Institusi         string                  `json:"institusi"`
		PosisiBidang      string                  `json:"posisi_bidang"`
		FotoProfil        string                  `json:"foto_profil"`
		StatusPengumpulan string                  `json:"status_pengumpulan"` // "belum" | "menunggu" | "revisi" | "dinilai"
		Pengumpulan       *models.PengumpulanTugas `json:"pengumpulan"`
	}

	var hasilPeserta []PesertaSubmissionItem
	now := time.Now()

	for _, m := range mentees {
		var pID uint
		if m.AkunPesertaID != nil {
			pID = *m.AkunPesertaID
		}
		foto := ""
		if m.AkunPeserta != nil && m.AkunPeserta.FotoProfil != "" {
			foto = m.AkunPeserta.FotoProfil
		} else if m.FilePasFoto != "" {
			foto = m.FilePasFoto
		}

		institusi := m.AsalKampus
		if m.KategoriPendaftar == "siswa" && m.AsalSekolah != "" {
			institusi = m.AsalSekolah
		}

		item := PesertaSubmissionItem{
			PesertaID:    pID,
			Nama:         m.NamaLengkap,
			Email:        m.Email,
			Institusi:    institusi,
			PosisiBidang: m.PosisiBidang,
			FotoProfil:   foto,
		}

		if sub, ada := mapKumpul[pID]; ada {
			item.Pengumpulan = &sub
			item.StatusPengumpulan = sub.Status
		} else {
			item.Pengumpulan = nil
			if tugas.TenggatWaktu != nil && now.After(*tugas.TenggatWaktu) {
				item.StatusPengumpulan = "terlambat_belum_kumpul"
			} else {
				item.StatusPengumpulan = "belum_kumpul"
			}
		}

		hasilPeserta = append(hasilPeserta, item)
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail tugas dan pengumpulan berhasil dimuat", gin.H{
		"tugas":       tugas,
		"submissions": hasilPeserta,
		"total_target": len(mentees),
		"total_kumpul": len(pengumpulanList),
	})
}

// ── 7. REVIEW / ACC PENGUMPULAN TUGAS OLEH MENTOR (SISTEM NILAI OTOMATIS) ──
// Aturan Penilaian Otomatis (Opsi 1):
// - ACC Tepat Waktu = 100 poin
// - ACC Terlambat = 80 poin
// - Revisi = Status berubah menjadi 'revisi' dengan instruksi perbaikan
type ReviewTugasInput struct {
	Action        string   `json:"action" binding:"required"` // "acc" | "revisi" | "nilai_manual" | "nilai_kuis"
	Nilai         *float64 `json:"nilai"`
	CatatanMentor string   `json:"catatan_mentor"`
	JawabanKuis   string   `json:"jawaban_kuis"`
	StatusRemidi  string   `json:"status_remidi"` // "tuntas" | "perlu_remidi" | "tidak"
}

func ReviewPengumpulanTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("pengumpulan_id")
	pengumpulanID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID pengumpulan tidak valid")
		return
	}

	var req ReviewTugasInput
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data review tidak valid")
		return
	}

	var pengumpulan models.PengumpulanTugas
	if err := config.DB.Preload("Tugas").Where("id = ?", pengumpulanID).First(&pengumpulan).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pengumpulan tugas tidak ditemukan")
		return
	}

	// Validasi bahwa tugas ini di bawah bimbingan mentor
	if pengumpulan.Tugas.MentorID != nil && *pengumpulan.Tugas.MentorID != mentorID {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda tidak memiliki wewenang untuk menilai tugas ini")
		return
	}

	now := time.Now()
	switch strings.ToLower(req.Action) {
	case "nilai_kuis", "nilai_manual":
		if req.Nilai != nil {
			pengumpulan.Nilai = req.Nilai
		}
		pengumpulan.Status = "dinilai"
		pengumpulan.DinilaiPada = &now
		pengumpulan.CatatanMentor = strings.TrimSpace(req.CatatanMentor)
		if strings.TrimSpace(req.JawabanKuis) != "" {
			pengumpulan.JawabanKuis = strings.TrimSpace(req.JawabanKuis)
		}
		if strings.TrimSpace(req.StatusRemidi) != "" {
			pengumpulan.StatusRemidi = strings.TrimSpace(req.StatusRemidi)
		}

	case "acc", "setuju", "dinilai":
		var nilai float64 = 100.0
		// Cek apakah waktu kumpul melebihi tenggat waktu tugas
		if pengumpulan.Tugas.TenggatWaktu != nil && pengumpulan.WaktuKumpul.After(*pengumpulan.Tugas.TenggatWaktu) {
			nilai = 80.0 // Penalti otomatis keterlambatan (80 poin)
		}

		if req.Nilai != nil {
			nilai = *req.Nilai
		}

		pengumpulan.Status = "dinilai"
		pengumpulan.Nilai = &nilai
		pengumpulan.DinilaiPada = &now
		pengumpulan.CatatanMentor = strings.TrimSpace(req.CatatanMentor)
		if strings.TrimSpace(req.StatusRemidi) != "" {
			pengumpulan.StatusRemidi = strings.TrimSpace(req.StatusRemidi)
		}

	case "revisi":
		pengumpulan.Status = "revisi"
		pengumpulan.CatatanMentor = strings.TrimSpace(req.CatatanMentor)
		pengumpulan.StatusRemidi = "perlu_remidi"

	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Aksi penilaian tidak dikenali (gunakan 'acc' atau 'revisi')")
		return
	}

	if err := config.DB.Save(&pengumpulan).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan hasil review tugas")
		return
	}

	pesan := "Tugas berhasil disetujui (ACC)"
	if strings.ToLower(req.Action) == "revisi" {
		pesan = "Permintaan revisi tugas berhasil dikirimkan ke peserta"
	}

	utils.SuccessResponse(c, http.StatusOK, pesan, pengumpulan)
}

// ── 8. SET NILAI 0 UNTUK PESERTA YANG TIDAK MENGUMPULKAN TUGAS ──
type BeriNilaiNolInput struct {
	TugasID   uint   `json:"tugas_id" binding:"required"`
	PesertaID uint   `json:"peserta_id" binding:"required"`
	Catatan   string `json:"catatan"`
}

func SetNilaiNolTugasMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var req BeriNilaiNolInput
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data permintaan tidak valid")
		return
	}

	var tugas models.TugasMagang
	if err := config.DB.Where("id = ? AND (mentor_id = ? OR mentor_id IS NULL)", req.TugasID, mentorID).First(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Tugas tidak ditemukan")
		return
	}

	now := time.Now()
	var nilai float64 = 0.0

	var pengumpulan models.PengumpulanTugas
	err := config.DB.Where("tugas_id = ? AND peserta_id = ?", req.TugasID, req.PesertaID).First(&pengumpulan).Error
	if err != nil {
		// Peserta belum pernah mengumpulkan: buat record nilai 0
		catatan := strings.TrimSpace(req.Catatan)
		if catatan == "" {
			catatan = "Tidak mengumpulkan tugas hingga batas waktu berakhir."
		}

		pengumpulan = models.PengumpulanTugas{
			TugasID:       req.TugasID,
			PesertaID:     req.PesertaID,
			WaktuKumpul:   now,
			Status:        "dinilai",
			Nilai:         &nilai,
			CatatanMentor: catatan,
			DinilaiPada:   &now,
		}
		if err := config.DB.Create(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menetapkan nilai 0")
			return
		}
	} else {
		// Jika sudah ada record tapi mau ditetapkan 0
		pengumpulan.Status = "dinilai"
		pengumpulan.Nilai = &nilai
		pengumpulan.DinilaiPada = &now
		if strings.TrimSpace(req.Catatan) != "" {
			pengumpulan.CatatanMentor = strings.TrimSpace(req.Catatan)
		}
		if err := config.DB.Save(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui nilai 0")
			return
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Nilai 0 poin berhasil ditetapkan untuk peserta", pengumpulan)
}

