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

// simpanFileLaporan menyimpan file PDF laporan akhir magang ke uploads/laporan-magang/YYYY-MM
func simpanFileLaporan(c *gin.Context, file *multipart.FileHeader, pesertaID uint) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" {
		return "", errors.New("hanya berkas dengan format PDF yang diperbolehkan")
	}

	// Maksimal 20 MB
	if file.Size > 20*1024*1024 {
		return "", errors.New("ukuran berkas laporan maksimal 20 MB")
	}

	uploadDir := filepath.Join("uploads", "laporan-magang", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan laporan magang")
	}

	fileName := fmt.Sprintf("laporan_peserta_%d_%d%s", pesertaID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas laporan magang")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

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

// ── 1. Get Logbook & Laporan Akhir Peserta ─────────────────────────────────────

func GetLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	// Ambil data mentor
	var mentorData gin.H = nil
	if hasPendaftaran && pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
			}
		}
	}

	// Ambil seluruh daftar presensi peserta
	var presensiList []models.Presensi
	config.DB.
		Where("peserta_id = ?", pesertaID).
		Order("tanggal desc").
		Find(&presensiList)

	// Hitung statistik logbook
	totalPresensi := len(presensiList)
	totalHadir := 0
	totalLogbookTerisi := 0
	for _, p := range presensiList {
		if p.Status == "hadir" || p.Status == "terlambat" {
			totalHadir++
		}
		if strings.TrimSpace(p.Keterangan) != "" {
			totalLogbookTerisi++
		}
	}

	persenLogbook := 0.0
	if totalHadir > 0 {
		persenLogbook = float64(totalLogbookTerisi) / float64(totalHadir) * 100
		if persenLogbook > 100 {
			persenLogbook = 100
		}
	}

	// Status review laporan akhir dari PenilaianMagang
	var penilaian models.PenilaianMagang
	adaPenilaian := config.DB.Where("peserta_id = ?", pesertaID).First(&penilaian).Error == nil

	laporanDisetujui := false
	statusReview := "belum_unggah"
	catatanMentorLaporan := ""

	if hasPendaftaran && pendaftaran.FileLaporanAkhir != "" {
		statusReview = "menunggu_review"
		if adaPenilaian && penilaian.LaporanAkhirDisetujui {
			laporanDisetujui = true
			statusReview = "disetujui"
		}
		if adaPenilaian {
			catatanMentorLaporan = penilaian.CatatanMentor
		}
	}

	// Format data instansi untuk ekspor PDF
	var landing models.PengaturanLandingPage
	config.DB.First(&landing)
	var suratSetting models.PengaturanSuratPenerimaan
	config.DB.First(&suratSetting)

	utils.SuccessResponse(c, http.StatusOK, "Data logbook peserta berhasil dimuat", gin.H{
		"peserta": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"no_hp":         user.NoHp,
			"foto_profil":   user.FotoProfil,
			"status_magang": user.StatusMagang,
		},
		"pendaftaran": gin.H{
			"posisi_bidang":          pendaftaran.PosisiBidang,
			"institusi":              coalesceString(pendaftaran.AsalKampus, pendaftaran.AsalSekolah),
			"jurusan":                coalesceString(pendaftaran.ProgramStudi, pendaftaran.JurusanSekolah),
			"nim":                    coalesceString(pendaftaran.NpmNim, pendaftaran.Nisn),
			"tanggal_mulai":          pendaftaran.TanggalMulai,
			"tanggal_selesai":        pendaftaran.TanggalSelesai,
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
			"laporan_disetujui":      laporanDisetujui,
			"status_review_laporan":  statusReview,
			"catatan_mentor_laporan": catatanMentorLaporan,
		},
		"mentor": mentorData,
		"instansi": gin.H{
			"nama_pemerintah": landing.SubJudulSitus,
			"nama_instansi":   landing.NamaSitus,
			"alamat_instansi": landing.AlamatLengkap,
			"logo":            landing.FileLogo,
			"pejabat_nama":    suratSetting.NamaPenandatangan,
			"pejabat_nip":     suratSetting.NipPenandatangan,
			"pejabat_jabatan": suratSetting.JabatanPenandatangan,
			"stempel":         suratSetting.FileStempel,
			"ttd_pejabat":     suratSetting.FileTtd,
		},
		"statistik": gin.H{
			"total_presensi":       totalPresensi,
			"total_hadir":          totalHadir,
			"total_logbook_terisi": totalLogbookTerisi,
			"persentase_pengisian": persenLogbook,
		},
		"logbook": presensiList,
	})
}

// ── 2. Update Catatan Logbook Harian Peserta ───────────────────────────────────

func UpdateLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	presensiID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID presensi tidak valid")
		return
	}

	var presensi models.Presensi
	if err := config.DB.Where("id = ? AND peserta_id = ?", presensiID, pesertaID).First(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Catatan presensi tidak ditemukan")
		return
	}

	var req struct {
		Keterangan string `json:"keterangan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Deskripsi logbook wajib diisi")
		return
	}

	presensi.Keterangan = strings.TrimSpace(req.Keterangan)
	if err := config.DB.Save(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui catatan logbook")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Catatan logbook berhasil diperbarui", presensi)
}

// ── 3. Upload Laporan Akhir & Portofolio Proyek Peserta ─────────────────────────

func UploadLaporanAkhirPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran magang tidak ditemukan")
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul_laporan_akhir"))
	linkProyek := strings.TrimSpace(c.PostForm("link_proyek"))
	catatan := strings.TrimSpace(c.PostForm("catatan_laporan_akhir"))

	fileLaporan, _ := c.FormFile("file_laporan")
	var fileLaporanPath string
	if fileLaporan != nil {
		path, err := simpanFileLaporan(c, fileLaporan, pesertaID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
			return
		}
		fileLaporanPath = path
	}

	if judul != "" {
		pendaftaran.JudulLaporanAkhir = judul
	}
	if linkProyek != "" {
		pendaftaran.LinkProyek = linkProyek
	}
	pendaftaran.CatatanLaporanAkhir = catatan

	now := time.Now()
	var oldLaporan string
	if fileLaporanPath != "" {
		oldLaporan = pendaftaran.FileLaporanAkhir
		pendaftaran.FileLaporanAkhir = fileLaporanPath
		pendaftaran.TanggalUploadLaporan = &now
	} else if pendaftaran.TanggalUploadLaporan == nil && pendaftaran.FileLaporanAkhir != "" {
		pendaftaran.TanggalUploadLaporan = &now
	}

	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		if fileLaporanPath != "" {
			_ = os.Remove(fileLaporanPath)
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan data laporan akhir")
		return
	}

	// Hapus file laporan lama dari server jika diperbarui
	if oldLaporan != "" && oldLaporan != fileLaporanPath {
		cleanOld := strings.TrimPrefix(strings.ReplaceAll(oldLaporan, "\\", "/"), "/")
		if strings.HasPrefix(cleanOld, "uploads/") && !strings.Contains(cleanOld, "..") {
			_ = os.Remove(cleanOld)
		}
	}

	// Kirim notifikasi ke mentor pembimbing jika ada
	if pendaftaran.MentorID != nil {
		mentorID := *pendaftaran.MentorID
		go services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "mentor",
			TargetUserID: &mentorID,
			Tipe:         "laporan_akhir",
			Prioritas:    "tinggi",
			Judul:        "Laporan Akhir Magang Diserahkan",
			Pesan:        fmt.Sprintf("Peserta %s telah mengunggah Laporan Akhir Magang (%s). Silakan tinjau.", pendaftaran.NamaLengkap, pendaftaran.JudulLaporanAkhir),
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pendaftaran.ID,
			UrlTujuan:    "/mentor/penilaian",
			Gabungkan:    false,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Laporan akhir magang berhasil disimpan", gin.H{
		"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
		"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
		"link_proyek":            pendaftaran.LinkProyek,
		"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
		"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
	})
}

// ── 4. Upload / Perbarui Dokumen Lampiran Pendaftaran dari Halaman Akun ────────

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

func coalesceString(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

