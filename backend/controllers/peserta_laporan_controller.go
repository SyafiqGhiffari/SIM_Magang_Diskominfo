package controllers

import (
	"errors"
	"fmt"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"
)

// GetLaporanAkhirPeserta mengambil data status laporan akhir magang untuk peserta yang sedang login
func GetLaporanAkhirPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran magang tidak ditemukan")
		return
	}

	var mentorData gin.H = nil
	if pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"nip":         mentor.Nip,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
			}
		}
	}

	hariIniStr := utils.TanggalHariIni()
	hariIniTime, _ := time.Parse("2006-01-02", hariIniStr)
	totalHari := 0
	hariKe := 0
	sisaHari := 0
	progresPersen := 0.0
	statusTimeline := "belum_mulai"

	if pendaftaran.TanggalMulai != "" && pendaftaran.TanggalSelesai != "" {
		tMulai, errMulai := time.Parse("2006-01-02", pendaftaran.TanggalMulai)
		tSelesai, errSelesai := time.Parse("2006-01-02", pendaftaran.TanggalSelesai)
		if errMulai == nil && errSelesai == nil {
			totalHari = int(tSelesai.Sub(tMulai).Hours()/24) + 1
			if totalHari < 1 {
				totalHari = 1
			}
			if hariIniTime.Before(tMulai) {
				statusTimeline = "belum_mulai"
				sisaHari = totalHari
			} else if hariIniTime.After(tSelesai) {
				statusTimeline = "selesai"
				hariKe = totalHari
				sisaHari = 0
				progresPersen = 100.0
			} else {
				statusTimeline = "berjalan"
				hariKe = int(hariIniTime.Sub(tMulai).Hours()/24) + 1
				if hariKe > totalHari {
					hariKe = totalHari
				}
				sisaHari = totalHari - hariKe
				if sisaHari < 0 {
					sisaHari = 0
				}
				progresPersen = math.Round((float64(hariKe)/float64(totalHari)*100)*10) / 10
			}
		}
	}

	var penilaian models.PenilaianMagang
	adaPenilaian := config.DB.Where("peserta_id = ?", pesertaID).First(&penilaian).Error == nil

	laporanDisetujui := (adaPenilaian && penilaian.LaporanAkhirDisetujui) || pendaftaran.StatusLaporanAkhir == "disetujui"
	statusLaporan := "belum_unggah"
	catatanMentorLaporan := pendaftaran.CatatanMentorLaporan
	if catatanMentorLaporan == "" && adaPenilaian {
		catatanMentorLaporan = penilaian.CatatanMentor
	}

	if strings.TrimSpace(pendaftaran.FileLaporanAkhir) != "" {
		if laporanDisetujui {
			statusLaporan = "disetujui"
		} else if pendaftaran.StatusLaporanAkhir == "revisi" || pendaftaran.StatusLaporanAkhir == "perlu_revisi" {
			statusLaporan = "perlu_revisi"
		} else {
			statusLaporan = "menunggu_review"
		}
	}

	institusi := pendaftaran.AsalSekolah
	jurusan := pendaftaran.JurusanSekolah
	nimNisn := pendaftaran.Nisn
	if pendaftaran.KategoriPendaftar == "mahasiswa" {
		institusi = pendaftaran.AsalKampus
		jurusan = pendaftaran.ProgramStudi
		nimNisn = pendaftaran.NpmNim
	}

	utils.SuccessResponse(c, http.StatusOK, "Data laporan akhir peserta berhasil dimuat", gin.H{
		"pendaftaran": gin.H{
			"id":                     pendaftaran.ID,
			"posisi_bidang":          pendaftaran.PosisiBidang,
			"institusi":              institusi,
			"jurusan_prodi":          jurusan,
			"nomor_identitas":        nimNisn,
			"kategori_pendaftar":     pendaftaran.KategoriPendaftar,
			"tanggal_mulai":          pendaftaran.TanggalMulai,
			"tanggal_selesai":        pendaftaran.TanggalSelesai,
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
		},
		"laporan_akhir": gin.H{
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"status":                 statusLaporan,
			"status_laporan":         statusLaporan,
			"disetujui":              laporanDisetujui,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
			"sisa_hari":              sisaHari,
		},
		"timeline": gin.H{
			"status":         statusTimeline,
			"total_hari":     totalHari,
			"hari_ke":        hariKe,
			"sisa_hari":      sisaHari,
			"progres_persen": progresPersen,
		},
		"mentor": mentorData,
	})
}

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

// UploadLaporanAkhirPeserta menangani pengunggahan / pembaruan naskah laporan akhir & tautan luaran proyek oleh peserta
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
	if judul == "" {
		judul = strings.TrimSpace(c.PostForm("judul"))
	}
	linkProyek := strings.TrimSpace(c.PostForm("link_proyek"))
	catatan := strings.TrimSpace(c.PostForm("catatan_laporan_akhir"))
	if catatan == "" {
		catatan = strings.TrimSpace(c.PostForm("catatan"))
	}

	fileLaporan, errFile := c.FormFile("file_laporan")
	if errFile != nil {
		fileLaporan, _ = c.FormFile("file")
	}
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
	pendaftaran.StatusLaporanAkhir = "menunggu_review"

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

	// Hapus file laporan lama dari server jika berkas diperbarui
	if oldLaporan != "" && oldLaporan != fileLaporanPath {
		cleanOld := strings.TrimPrefix(strings.ReplaceAll(oldLaporan, "\\", "/"), "/")
		if strings.HasPrefix(cleanOld, "uploads/") && !strings.Contains(cleanOld, "..") {
			_ = os.Remove(cleanOld)
		}
	}

	// Sinkronkan status persetujuan pada penilaian magang jika ada (kembali menjadi menunggu review)
	if pendaftaran.AkunPesertaID != nil {
		var pen models.PenilaianMagang
		if errPen := config.DB.Where("peserta_id = ?", *pendaftaran.AkunPesertaID).First(&pen).Error; errPen == nil {
			if pen.LaporanAkhirDisetujui {
				pen.LaporanAkhirDisetujui = false
				_, _, _, _, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, *pendaftaran.AkunPesertaID, false)
				pen.NilaiAdministratif = rataAdmin
				setting, _ := GetOrCreatePengaturanPenilaian(config.DB)
				nilaiAkhir := (pen.NilaiProfesional*setting.BobotProfesional +
					pen.NilaiPersonal*setting.BobotPersonal +
					pen.NilaiSosial*setting.BobotSosial +
					pen.NilaiAdministratif*setting.BobotAdministratif) / 100.0
				pen.NilaiAkhirAngka = nilaiAkhir
				pen.IndeksNilaiAkhir, pen.PredikatAkhir = HitungIndeksDanPredikat(nilaiAkhir)
				_ = config.DB.Save(&pen)
			}
		}
	}

	// Tandai notifikasi pengingat peserta sebagai sudah dibaca
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'laporan_akhir' AND judul LIKE 'Pengingat%' AND dibaca_pada IS NULL", pesertaID).
		Update("dibaca_pada", time.Now())

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
			UrlTujuan:    "/mentor/laporan-akhir",
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
