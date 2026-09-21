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
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// simpanFileTugas menyimpan berkas pengumpulan tugas ke uploads/tugas-peserta/YYYY-MM
func simpanFileTugas(c *gin.Context, file *multipart.FileHeader, pesertaID uint, tugasID uint) (string, error) {
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
		".png":  true,
		".jpg":  true,
		".jpeg": true,
	}

	if !allowed[ext] {
		return "", errors.New("format berkas tidak didukung (harus PDF, ZIP, RAR, DOCX, PPTX, atau Gambar)")
	}

	if file.Size > 25*1024*1024 {
		return "", errors.New("ukuran berkas tugas maksimal 25 MB")
	}

	uploadDir := filepath.Join("uploads", "tugas-peserta", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan tugas")
	}

	fileName := fmt.Sprintf("tugas_%d_peserta_%d_%d%s", tugasID, pesertaID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas tugas")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// pastikanMateriBawaan membuat materi standar Diskominfo jika tabel masih kosong
func pastikanMateriBawaan() {
	var count int64
	config.DB.Model(&models.MateriPembelajaran{}).Count(&count)
	if count > 0 {
		return
	}

	materiAwal := []models.MateriPembelajaran{
		{
			Judul:           "Buku Panduan Orientasi & Etika Magang Diskominfo",
			Deskripsi:       "Panduan umum mengenai tata tertib kantor, standar jam kerja, etika komunikasi birokrasi, dan alur pelaporan magang.",
			Kategori:        "Onboarding & SOP",
			PosisiBidang:    "semua",
			TipeMedia:       "dokumen",
			TautanEksternal: "https://diskominfo.go.id",
		},
		{
			Judul:           "Standar Keamanan Informasi & Pengelolaan Akun Dinas",
			Deskripsi:       "Prinsip dasar Information Security, manajemen kredensial, proteksi data privasi, dan pencegahan serangan phishing di lingkungan pemerintahan.",
			Kategori:        "Keamanan Informasi",
			PosisiBidang:    "semua",
			TipeMedia:       "slide",
			TautanEksternal: "",
		},
		{
			Judul:           "Panduan Alur Pengembangan Sistem & Git Workflow",
			Deskripsi:       "Standar pembuatan branch, commit conventions, code review, dan deployment aplikasi pemerintahan berbasis Clean Code.",
			Kategori:        "Teknologi Informasi & Kode",
			PosisiBidang:    "semua",
			TipeMedia:       "dokumen",
			TautanEksternal: "https://github.com",
		},
		{
			Judul:           "Pedoman Penulisan Laporan & Dokumentasi Proyek",
			Deskripsi:       "Format penyusunan laporan teknis mingguan, penulisan dokumentasi API / modul sistem, dan petunjuk format BAB 1-5.",
			Kategori:        "Administrasi & Pelaporan",
			PosisiBidang:    "semua",
			TipeMedia:       "dokumen",
			TautanEksternal: "",
		},
	}

	for _, m := range materiAwal {
		config.DB.Create(&m)
	}
}

// pastikanTugasBawaan membuat tugas orientasi jika belum ada tugas
func pastikanTugasBawaan(mentorID *uint) {
	var count int64
	config.DB.Model(&models.TugasMagang{}).Count(&count)
	if count > 0 {
		return
	}

	deadline := time.Now().AddDate(0, 0, 7) // 7 hari ke depan
	tugasAwal := []models.TugasMagang{
		{
			Judul:        "Penyusunan Rencana Kerja & Analisis Kebutuhan Magang",
			Deskripsi:    "Susunlah dokumen rencana kerja magang mandiri (Work Plan) yang memuat target capaian kompetensi, modul sistem yang akan dikembangkan/dianalisis, serta jadwal pengerjaan mingguan selama periode magang.",
			PosisiBidang: "semua",
			MentorID:     mentorID,
			TenggatWaktu: &deadline,
			BobotNilai:   100,
		},
	}

	for _, t := range tugasAwal {
		config.DB.Create(&t)
	}
}

// ── 1. GET MATERI PEMBELAJARAN PESERTA ────────────────────────────────────────

func GetMateriPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	pastikanMateriBawaan()

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran)

	bidang := pendaftaran.PosisiBidang

	var materiList []models.MateriPembelajaran
	q := config.DB.Model(&models.MateriPembelajaran{})
	if bidang != "" {
		q = q.Where("posisi_bidang = 'semua' OR posisi_bidang = ?", bidang)
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
		"bidang":          bidang,
		"kategori":        daftarKategori,
		"total_materi":    len(materiList),
		"materi":          materiList,
	})
}

// ── 2. GET TUGAS MAGANG PESERTA ───────────────────────────────────────────────

func GetTugasPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran)

	pastikanTugasBawaan(pendaftaran.MentorID)

	bidang := pendaftaran.PosisiBidang

	// Query tugas yang relevan untuk peserta ini
	var tugasList []models.TugasMagang
	q := config.DB.Model(&models.TugasMagang{}).Preload("Mentor")
	if bidang != "" {
		q = q.Where("(posisi_bidang = 'semua' OR posisi_bidang = ?) AND (peserta_id IS NULL OR peserta_id = ?)", bidang, pesertaID)
	} else {
		q = q.Where("peserta_id IS NULL OR peserta_id = ?", pesertaID)
	}
	q.Order("id desc").Find(&tugasList)

	// Ambil semua pengumpulan tugas milik peserta ini
	var pengumpulanList []models.PengumpulanTugas
	config.DB.Where("peserta_id = ?", pesertaID).Find(&pengumpulanList)

	mapPengumpulan := make(map[uint]models.PengumpulanTugas)
	for _, p := range pengumpulanList {
		mapPengumpulan[p.TugasID] = p
	}

	type TugasPesertaItem struct {
		models.TugasMagang
		Pengumpulan *models.PengumpulanTugas `json:"pengumpulan"`
		StatusTugas string                   `json:"status_tugas"` // "belum_kumpul" | "menunggu" | "revisi" | "dinilai" | "terlambat"
	}

	var hasil []TugasPesertaItem
	totalSelesai := 0
	totalMenunggu := 0
	totalBelum := 0
	var totalNilai float64 = 0
	jumlahDinilai := 0

	now := time.Now()

	for _, t := range tugasList {
		var item TugasPesertaItem
		item.TugasMagang = t

		if p, ada := mapPengumpulan[t.ID]; ada {
			item.Pengumpulan = &p
			item.StatusTugas = p.Status
			switch p.Status {
			case "dinilai":
				totalSelesai++
				if p.Nilai != nil {
					totalNilai += *p.Nilai
					jumlahDinilai++
				}
			case "menunggu":
				totalMenunggu++
			}
		} else {
			item.Pengumpulan = nil
			if t.TenggatWaktu != nil && now.After(*t.TenggatWaktu) {
				item.StatusTugas = "terlambat"
			} else {
				item.StatusTugas = "belum_kumpul"
			}
			totalBelum++
		}

		hasil = append(hasil, item)
	}

	rataNilai := 0.0
	if jumlahDinilai > 0 {
		rataNilai = totalNilai / float64(jumlahDinilai)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar tugas magang berhasil dimuat", gin.H{
		"statistik": gin.H{
			"total_tugas":       len(tugasList),
			"belum_dikerjakan":  totalBelum,
			"menunggu_review":   totalMenunggu,
			"telah_dinilai":     totalSelesai,
			"rata_rata_nilai":   rataNilai,
		},
		"tugas": hasil,
	})
}

// ── 3. KUMPUL / SERAHKAN TUGAS PESERTA ─────────────────────────────────────────

func KumpulTugasPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	tugasIDParam := c.Param("id")
	tugasIDUint, err := strconv.ParseUint(tugasIDParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID tugas tidak valid")
		return
	}
	tugasID := uint(tugasIDUint)

	var tugas models.TugasMagang
	if err := config.DB.First(&tugas, tugasID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Tugas magang tidak ditemukan")
		return
	}

	linkTugas := strings.TrimSpace(c.PostForm("link_tugas"))
	catatanPeserta := strings.TrimSpace(c.PostForm("catatan_peserta"))
	fileHeader, _ := c.FormFile("file_tugas")

	if linkTugas == "" && fileHeader == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Harap lampirkan berkas tugas atau tautan proyek")
		return
	}

	var filePath string
	if fileHeader != nil {
		path, errSave := simpanFileTugas(c, fileHeader, pesertaID, tugasID)
		if errSave != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, errSave.Error())
			return
		}
		filePath = path
	}

	var pengumpulan models.PengumpulanTugas
	adaPengumpulan := config.DB.Where("tugas_id = ? AND peserta_id = ?", tugasID, pesertaID).First(&pengumpulan).Error == nil

	now := time.Now()
	if adaPengumpulan {
		if filePath != "" {
			pengumpulan.FilePengumpulan = filePath
		}
		if linkTugas != "" {
			pengumpulan.LinkTugas = linkTugas
		}
		pengumpulan.CatatanPeserta = catatanPeserta
		pengumpulan.WaktuKumpul = now
		pengumpulan.Status = "menunggu" // reset ke menunggu review saat submit ulang/revisi
		if err := config.DB.Save(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui pengumpulan tugas")
			return
		}
	} else {
		pengumpulan = models.PengumpulanTugas{
			TugasID:         tugasID,
			PesertaID:       pesertaID,
			FilePengumpulan: filePath,
			LinkTugas:       linkTugas,
			CatatanPeserta:  catatanPeserta,
			WaktuKumpul:     now,
			Status:          "menunggu",
		}
		if err := config.DB.Create(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengumpulkan tugas")
			return
		}
	}

	// Notifikasi ke mentor jika ada
	if tugas.MentorID != nil {
		mentorID := *tugas.MentorID
		var userPeserta models.UserManajemen
		config.DB.First(&userPeserta, pesertaID)

		go services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "mentor",
			TargetUserID: &mentorID,
			Tipe:         "tugas_dikumpulkan",
			Prioritas:    "normal",
			Judul:        "Tugas Magang Dikumpulkan",
			Pesan:        fmt.Sprintf("Peserta %s telah mengumpulkan tugas: %s", userPeserta.Nama, tugas.Judul),
			RefTabel:     "pengumpulan_tugas",
			RefID:        &pengumpulan.ID,
			UrlTujuan:    "/mentor/penilaian",
			Gabungkan:    false,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil dikumpulkan", pengumpulan)
}
