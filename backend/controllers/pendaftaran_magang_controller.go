package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// Struktur satu entri status verifikasi per-dokumen (dipakai untuk parse/serialize JSON DetailVerifikasi)
type verifikasiEntry struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

// Fungsi untuk mengambil user_id dari context yang disimpan oleh middleware
func getUserIDFromContext(c *gin.Context) (uint, bool) {
	userIDValue, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	switch v := userIDValue.(type) {
	case float64:
		return uint(v), true
	case uint:
		return v, true
	case int:
		return uint(v), true
	default:
		return 0, false
	}
}

// Fungsi untuk validasi file saja, belum menyimpan file ke folder uploads
const maxFileSize = 10 * 1024 * 1024 // 10MB

var digitOnlyRegex = regexp.MustCompile(`^[0-9]+$`)

var pdfExtensions = map[string]bool{".pdf": true}
var imageExtensions = map[string]bool{".jpg": true, ".jpeg": true, ".png": true}

var pdfMimeTypes = map[string]bool{"application/pdf": true}
var imageMimeTypes = map[string]bool{"image/jpeg": true, "image/png": true}

const pdfLabel = "PDF"
const imageLabel = "JPG, JPEG, atau PNG"

func validateUploadedFile(c *gin.Context, fieldName string, required bool, allowedExt map[string]bool, allowedMime map[string]bool, allowedLabel string) (*multipart.FileHeader, error) {
	file, err := c.FormFile(fieldName)

	if err != nil {
		if required {
			return nil, errors.New("file " + fieldName + " wajib diunggah")
		}
		return nil, nil
	}

	if file.Size > maxFileSize {
		return nil, errors.New("ukuran file " + fieldName + " maksimal 10MB")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		return nil, errors.New("format file " + fieldName + " harus " + allowedLabel)
	}

	// --- Cek isi file lewat magic bytes, bukan hanya ekstensi ---
	src, err := file.Open()
	if err != nil {
		return nil, errors.New("gagal membaca file " + fieldName)
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := src.Read(buf)
	contentType := http.DetectContentType(buf[:n])

	if !allowedMime[contentType] {
		return nil, errors.New("isi file " + fieldName + " tidak sesuai format yang diklaim (harus " + allowedLabel + ")")
	}

	return file, nil
}

// Fungsi untuk menyimpan file setelah semua file dinyatakan valid
func saveUploadedFileFromHeader(c *gin.Context, file *multipart.FileHeader, fieldName string, folderName string) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))

	uploadDir := filepath.Join("uploads", "pendaftaran", folderName)

	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder upload")
	}

	fileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), fieldName, ext)
	filePath := filepath.Join(uploadDir, fileName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan file " + fieldName)
	}

	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// Fungsi untuk menghapus file jika proses berikutnya gagal
func cleanupUploadedFiles(filePaths ...string) {
	for _, path := range filePaths {
		if path != "" {
			_ = os.Remove(path)
		}
	}
}

// Fungsi untuk peserta mengirim pendaftaran magang
func CreatePendaftaranMagang(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	var existingPendaftaran models.PendaftaranMagang
	if err := config.DB.Where("user_pendaftaran_id = ?", userID).First(&existingPendaftaran).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda sudah pernah mengirim pendaftaran magang")
		return
	}

	kategoriPendaftar := c.PostForm("kategori_pendaftar")
	if kategoriPendaftar != "mahasiswa" && kategoriPendaftar != "siswa" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Kategori pendaftar harus mahasiswa atau siswa")
		return
	}

	// Data Diri (wajib untuk kedua kategori)
	namaLengkap := c.PostForm("nama_lengkap")
	email := c.PostForm("email")
	nomorHP := c.PostForm("nomor_hp")
	alamatLengkap := c.PostForm("alamat_lengkap")
	tempatLahir := c.PostForm("tempat_lahir")
	tanggalLahir := c.PostForm("tanggal_lahir")
	jenisKelamin := c.PostForm("jenis_kelamin")

	if namaLengkap == "" || email == "" || nomorHP == "" || alamatLengkap == "" ||
		tempatLahir == "" || tanggalLahir == "" || jenisKelamin == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data diri belum lengkap")
		return
	}

	if !digitOnlyRegex.MatchString(nomorHP) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor HP harus berupa angka")
		return
	}

	// Data Pendidikan (kondisional per kategori)
	npmNim := c.PostForm("npm_nim")
	asalKampus := c.PostForm("asal_kampus")
	fakultas := c.PostForm("fakultas")
	programStudi := c.PostForm("program_studi")
	semester := c.PostForm("semester")

	nisn := c.PostForm("nisn")
	asalSekolah := c.PostForm("asal_sekolah")
	kelas := c.PostForm("kelas")
	jurusanSekolah := c.PostForm("jurusan_sekolah")

	if kategoriPendaftar == "mahasiswa" {
		if npmNim == "" || asalKampus == "" || fakultas == "" || programStudi == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Data pendidikan mahasiswa belum lengkap")
			return
		}
		if semester != "" {
			semesterInt, err := strconv.Atoi(semester)
			if err != nil || semesterInt < 1 || semesterInt > 14 {
				utils.ErrorResponse(c, http.StatusBadRequest, "Semester harus angka antara 1-14")
				return
			}
		}
	} else {
		if nisn == "" || asalSekolah == "" || kelas == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Data pendidikan siswa belum lengkap")
			return
		}
	}

	// Data Magang (wajib untuk kedua kategori)
	posisiBidang := c.PostForm("posisi_bidang")
	tanggalMulai := c.PostForm("tanggal_mulai")
	tanggalSelesai := c.PostForm("tanggal_selesai")

	if posisiBidang == "" || tanggalMulai == "" || tanggalSelesai == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data magang belum lengkap")
		return
	}

	// Dokumen: Surat Pengantar & Pas Foto wajib untuk kedua kategori.
	// CV, Transkrip/Rapor, Portofolio opsional untuk kedua kategori.
	// Proposal Magang wajib untuk mahasiswa, opsional untuk siswa.
	proposalRequired := kategoriPendaftar == "mahasiswa"

	// 1. Validasi semua file terlebih dahulu
	cvHeader, err := validateUploadedFile(c, "file_cv", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	suratPengantarHeader, err := validateUploadedFile(c, "file_surat_pengantar", true, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	transkripHeader, err := validateUploadedFile(c, "file_transkrip", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	portofolioHeader, err := validateUploadedFile(c, "file_portofolio", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pasFotoHeader, err := validateUploadedFile(c, "file_pas_foto", true, imageExtensions, imageMimeTypes, imageLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	proposalHeader, err := validateUploadedFile(c, "file_proposal_magang", proposalRequired, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// 2. Jika semua file valid, baru simpan ke folder uploads
	fileCV, err := saveUploadedFileFromHeader(c, cvHeader, "file_cv", "cv")
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	fileSuratPengantar, err := saveUploadedFileFromHeader(c, suratPengantarHeader, "file_surat_pengantar", "surat_pengantar")
	if err != nil {
		cleanupUploadedFiles(fileCV)
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	fileTranskrip, err := saveUploadedFileFromHeader(c, transkripHeader, "file_transkrip", "transkrip")
	if err != nil {
		cleanupUploadedFiles(fileCV, fileSuratPengantar)
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	filePortofolio, err := saveUploadedFileFromHeader(c, portofolioHeader, "file_portofolio", "portofolio")
	if err != nil {
		cleanupUploadedFiles(fileCV, fileSuratPengantar, fileTranskrip)
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	filePasFoto, err := saveUploadedFileFromHeader(c, pasFotoHeader, "file_pas_foto", "pas_foto")
	if err != nil {
		cleanupUploadedFiles(fileCV, fileSuratPengantar, fileTranskrip, filePortofolio)
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	fileProposalMagang, err := saveUploadedFileFromHeader(c, proposalHeader, "file_proposal_magang", "proposal")
	if err != nil {
		cleanupUploadedFiles(fileCV, fileSuratPengantar, fileTranskrip, filePortofolio, filePasFoto)
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	pendaftaran := models.PendaftaranMagang{
		UserPendaftaranID: userID,
		KategoriPendaftar: kategoriPendaftar,

		NamaLengkap:   namaLengkap,
		NpmNim:        npmNim,
		Email:         email,
		NomorHP:       nomorHP,
		AlamatLengkap: alamatLengkap,
		TempatLahir:   tempatLahir,
		TanggalLahir:  tanggalLahir,
		JenisKelamin:  jenisKelamin,

		AsalKampus:   asalKampus,
		Fakultas:     fakultas,
		ProgramStudi: programStudi,
		Semester:     semester,

		Nisn:           nisn,
		AsalSekolah:    asalSekolah,
		Kelas:          kelas,
		JurusanSekolah: jurusanSekolah,

		PosisiBidang:   posisiBidang,
		TanggalMulai:   tanggalMulai,
		TanggalSelesai: tanggalSelesai,

		FileCV:             fileCV,
		FileSuratPengantar: fileSuratPengantar,
		FileTranskrip:      fileTranskrip,
		FilePortofolio:     filePortofolio,
		FilePasFoto:        filePasFoto,
		FileProposalMagang: fileProposalMagang,

		StatusPendaftaran: "menunggu",
	}

	if err := config.DB.Create(&pendaftaran).Error; err != nil {
		cleanupUploadedFiles(fileCV, fileSuratPengantar, fileTranskrip, filePortofolio, filePasFoto, fileProposalMagang)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pendaftaran magang")
		return
	}

	go func() {
		err := services.SendEmail(
			pendaftaran.Email,
			"Pendaftaran Magang Berhasil Dikirim",
			emailtemplates.TemplatePendaftaranBerhasil(pendaftaran.NamaLengkap),
		)
		if err != nil {
			log.Println("Gagal mengirim email pendaftaran:", err)
		}
	}()

	utils.SuccessResponse(c, http.StatusCreated, "Pendaftaran magang berhasil dikirim", pendaftaran)
}

// Fungsi untuk peserta melihat status pendaftaran magang mereka
func GetStatusPendaftaranSaya(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("user_pendaftaran_id = ?", userID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran belum ditemukan")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Data pendaftaran berhasil ditemukan", pendaftaran)
}

// Fungsi untuk admin melihat semua pendaftaran magang peserta
func GetAllPendaftaranMagang(c *gin.Context) {
	var pendaftarans []models.PendaftaranMagang

	if err := config.DB.Preload("UserPendaftaran").Order("created_at desc").Find(&pendaftarans).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data pendaftaran")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Data pendaftaran berhasil diambil", pendaftarans)
}

// Fungsi untuk admin melihat detail pendaftaran magang peserta
type UpdateStatusPendaftaranInput struct {
	StatusPendaftaran string `json:"status_pendaftaran" binding:"required"`
	CatatanAdmin      string `json:"catatan_admin"`
	DetailVerifikasi  string `json:"detail_verifikasi"`
	PosisiBidang      string `json:"posisi_bidang"`
	TanggalMulai      string `json:"tanggal_mulai"`
	Silent            bool   `json:"silent"` // true = hanya simpan progres, jangan kirim email/notifikasi
}
// Fungsi untuk admin mengubah status pendaftaran magang peserta
func UpdateStatusPendaftaranMagang(c *gin.Context) {
	id := c.Param("id")

	var input UpdateStatusPendaftaranInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	log.Println("DEBUG - Input diterima:", input) // ==== HAPUS SETELAH SELESAI DEBUG ====

	if input.StatusPendaftaran != "menunggu" &&
		input.StatusPendaftaran != "revisi" &&
		input.StatusPendaftaran != "diterima" &&
		input.StatusPendaftaran != "ditolak" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status pendaftaran harus menunggu, revisi, diterima, atau ditolak")
		return
	}

	// catatan_admin wajib diisi untuk status revisi/ditolak
	if (input.StatusPendaftaran == "revisi" || input.StatusPendaftaran == "ditolak") &&
		strings.TrimSpace(input.CatatanAdmin) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Catatan admin wajib diisi untuk status revisi atau ditolak")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Preload("UserPendaftaran").First(&pendaftaran, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	pendaftaran.StatusPendaftaran = input.StatusPendaftaran
	pendaftaran.CatatanAdmin = input.CatatanAdmin

	// Hanya timpa DetailVerifikasi kalau memang dikirim (tidak kosong). Endpoint ini
	// dipakai dua modal berbeda: ReviewModal (mengirim detail_verifikasi berisi checklist
	// per-berkas) dan DetailModal (keputusan akhir terima/tolak, TIDAK mengirim field ini
	// sama sekali). Tanpa pengecekan ini, DetailModal secara tidak sengaja menghapus
	// checklist yang sudah disetujui di ReviewModal, karena field kosong dari JSON
	// otomatis jadi string kosong dan menimpa data yang sudah tersimpan.
	if input.DetailVerifikasi != "" {
		pendaftaran.DetailVerifikasi = input.DetailVerifikasi
	}

	if input.StatusPendaftaran == "diterima" {
		if input.PosisiBidang != "" {
			pendaftaran.PosisiBidang = input.PosisiBidang
		}
		if input.TanggalMulai != "" {
			pendaftaran.TanggalMulai = input.TanggalMulai
		}
		pendaftaran.SuratPenerimaan = fmt.Sprintf("surat-penerimaan/pendaftaran-%s.pdf", id)
	}

	if input.StatusPendaftaran != "diterima" {
		pendaftaran.SuratPenerimaan = ""
	}

	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui status pendaftaran")
		return
	}

	if !input.Silent {
		go func() {
			subject := emailtemplates.SubjectStatusPendaftaran(pendaftaran.StatusPendaftaran)

			body := emailtemplates.TemplateStatusPendaftaran(
				pendaftaran.NamaLengkap,
				pendaftaran.StatusPendaftaran,
				pendaftaran.CatatanAdmin,
			)

			err := services.SendEmail(pendaftaran.Email, subject, body)
			if err != nil {
				log.Println("Gagal mengirim email status pendaftaran:", err)
			}
		}()
	}

	utils.SuccessResponse(c, http.StatusOK, "Status pendaftaran berhasil diperbarui", pendaftaran)
}

// Fungsi untuk peserta mengirim revisi dokumen jika status pendaftaran adalah revisi
func RevisiDokumenPendaftaranMagang(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("user_pendaftaran_id = ?", userID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	if pendaftaran.StatusPendaftaran != "revisi" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Dokumen hanya dapat diperbaiki jika status pendaftaran revisi")
		return
	}

	// 1. Validasi semua file revisi terlebih dahulu
	cvHeader, err := validateUploadedFile(c, "file_cv", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	suratPengantarHeader, err := validateUploadedFile(c, "file_surat_pengantar", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	transkripHeader, err := validateUploadedFile(c, "file_transkrip", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	portofolioHeader, err := validateUploadedFile(c, "file_portofolio", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pasFotoHeader, err := validateUploadedFile(c, "file_pas_foto", false, imageExtensions, imageMimeTypes, imageLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	proposalHeader, err := validateUploadedFile(c, "file_proposal_magang", false, pdfExtensions, pdfMimeTypes, pdfLabel)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if cvHeader == nil &&
		suratPengantarHeader == nil &&
		transkripHeader == nil &&
		portofolioHeader == nil &&
		pasFotoHeader == nil &&
		proposalHeader == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tidak ada dokumen revisi yang diunggah")
		return
	}

	var newUploadedFiles []string

	// 2. Setelah semua file valid, baru simpan file yang dikirim
	if cvHeader != nil {
		fileCV, err := saveUploadedFileFromHeader(c, cvHeader, "file_cv", "cv")
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, fileCV)
		pendaftaran.FileCV = fileCV
	}

	if suratPengantarHeader != nil {
		fileSuratPengantar, err := saveUploadedFileFromHeader(c, suratPengantarHeader, "file_surat_pengantar", "surat_pengantar")
		if err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, fileSuratPengantar)
		pendaftaran.FileSuratPengantar = fileSuratPengantar
	}

	if transkripHeader != nil {
		fileTranskrip, err := saveUploadedFileFromHeader(c, transkripHeader, "file_transkrip", "transkrip")
		if err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, fileTranskrip)
		pendaftaran.FileTranskrip = fileTranskrip
	}

	if portofolioHeader != nil {
		filePortofolio, err := saveUploadedFileFromHeader(c, portofolioHeader, "file_portofolio", "portofolio")
		if err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, filePortofolio)
		pendaftaran.FilePortofolio = filePortofolio
	}

	if pasFotoHeader != nil {
		filePasFoto, err := saveUploadedFileFromHeader(c, pasFotoHeader, "file_pas_foto", "pas_foto")
		if err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, filePasFoto)
		pendaftaran.FilePasFoto = filePasFoto
	}

	if proposalHeader != nil {
		fileProposalMagang, err := saveUploadedFileFromHeader(c, proposalHeader, "file_proposal_magang", "proposal")
		if err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}

		newUploadedFiles = append(newUploadedFiles, fileProposalMagang)
		pendaftaran.FileProposalMagang = fileProposalMagang
	}

	// Setelah peserta mengirim revisi, status kembali menunggu.
	// Hanya status verifikasi untuk berkas yang BENAR-BENAR diunggah ulang yang direset —
	// berkas lain yang sudah pernah disetujui admin sebelumnya (dan tidak disentuh peserta
	// pada revisi kali ini) tetap mempertahankan status "approved"-nya.
	existingDetail := map[string]verifikasiEntry{}
	if pendaftaran.DetailVerifikasi != "" {
			_ = json.Unmarshal([]byte(pendaftaran.DetailVerifikasi), &existingDetail)
		}

		reuploadedFields := map[string]bool{
			"file_cv":              cvHeader != nil,
			"file_surat_pengantar": suratPengantarHeader != nil,
			"file_transkrip":       transkripHeader != nil,
			"file_portofolio":      portofolioHeader != nil,
			"file_pas_foto":        pasFotoHeader != nil,
			"file_proposal_magang": proposalHeader != nil,
		}
		for field, wasReuploaded := range reuploadedFields {
			if wasReuploaded {
				delete(existingDetail, field) // hapus status lama -> otomatis jadi "belum ditinjau" lagi
			}
		}

		updatedDetailJSON, err := json.Marshal(existingDetail)
		if err != nil {
			updatedDetailJSON = []byte("{}")
		}

		pendaftaran.StatusPendaftaran = "menunggu"
		pendaftaran.CatatanAdmin = ""
		pendaftaran.DetailVerifikasi = string(updatedDetailJSON)
		pendaftaran.CatatanPeserta = c.PostForm("catatan")

		if err := config.DB.Save(&pendaftaran).Error; err != nil {
			cleanupUploadedFiles(newUploadedFiles...)
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan revisi dokumen")
			return
		}

		utils.SuccessResponse(c, http.StatusOK, "Revisi dokumen berhasil dikirim dan menunggu review ulang admin", pendaftaran)
	}

func GetDetailPendaftaranMagang(c *gin.Context) {
	id := c.Param("id")

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.First(&pendaftaran, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail pendaftaran berhasil diambil", pendaftaran)
}
