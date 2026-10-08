// ==============================================================================
// CONTROLLER: TUGAS CONTROLLER
// DESKRIPSI : Pengelolaan penugasan magang dan kuis interaktif bagi peserta bimbingan.
//             Mencakup pembuatan tugas/kuis, penilaian & revisi oleh mentor,
//             pengumpulan berkas/jawaban kuis oleh peserta, serta kalkulasi remidi.
// ROLE TERKAIT: [ROLE: MENTOR], [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"encoding/json"
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
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ==============================================================================
// ── HELPER & PENYIMPANAN BERKAS TUGAS ─────────────────────────────────────────
// ==============================================================================

// simpanFileLampiranTugas menyimpan berkas lampiran instruksi/soal tugas dari mentor ke uploads/tugas-magang/YYYY-MM
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

// simpanFileTugas menyimpan berkas pengumpulan tugas peserta ke uploads/tugas-peserta/YYYY-MM
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

// pastikanTugasBawaan membuat tugas orientasi awal jika basis data tugas masih kosong
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

// ==============================================================================
// ── BAGIAN MENTOR: KELOLA PENUGASAN MAGANG ────────────────────────────────────
// ==============================================================================

// ── 1. GET DAFTAR TUGAS MENTOR ────────────────────────────────────────────────
// [ROLE: MENTOR]
// GetTugasMentor mengambil seluruh daftar tugas dan kuis yang telah dibuat oleh mentor login beserta ringkasan status pengumpulan (menunggu review, dinilai, revisi).
// Endpoint: GET /api/manajemen/mentor/tugas
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

	// Pastikan foto profil peserta akses dan peserta spesifik terisi (fallback ke pas foto pendaftaran jika kosong)
	var allUserIDs []uint
	for _, t := range tugasList {
		if t.PesertaID != nil {
			allUserIDs = append(allUserIDs, *t.PesertaID)
		}
		for _, u := range t.PesertaAkses {
			allUserIDs = append(allUserIDs, u.ID)
		}
	}
	if len(allUserIDs) > 0 {
		var pendaftaransFoto []struct {
			AkunPesertaID uint   `gorm:"column:akun_peserta_id"`
			FilePasFoto   string `gorm:"column:file_pas_foto"`
		}
		config.DB.Model(&models.PendaftaranMagang{}).
			Select("akun_peserta_id, file_pas_foto").
			Where("akun_peserta_id IN ? AND file_pas_foto != ''", allUserIDs).
			Scan(&pendaftaransFoto)

		fotoMap := make(map[uint]string)
		for _, pf := range pendaftaransFoto {
			fotoMap[pf.AkunPesertaID] = pf.FilePasFoto
		}

		for i := range tugasList {
			if tugasList[i].Peserta != nil && tugasList[i].Peserta.FotoProfil == "" {
				if f, ok := fotoMap[tugasList[i].Peserta.ID]; ok {
					tugasList[i].Peserta.FotoProfil = f
				}
			}
			for j := range tugasList[i].PesertaAkses {
				if tugasList[i].PesertaAkses[j].FotoProfil == "" {
					if f, ok := fotoMap[tugasList[i].PesertaAkses[j].ID]; ok {
						tugasList[i].PesertaAkses[j].FotoProfil = f
					}
				}
			}
		}
	}

	// Ambil daftar peserta bimbingan aktif mentor ini untuk menghitung total target
	var menteesRaw []models.PendaftaranMagang
	config.DB.Preload("AkunPeserta").
		Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mentorID).
		Find(&menteesRaw)

	todayTrunc := time.Now().Truncate(24 * time.Hour)
	var mentees []models.PendaftaranMagang
	for _, m := range menteesRaw {
		if m.AkunPeserta != nil && (m.AkunPeserta.StatusMagang == "selesai" || m.AkunPeserta.StatusAkun != "aktif") {
			continue
		}
		if m.TanggalSelesai != "" {
			datePart := strings.Split(m.TanggalSelesai, "T")[0]
			if tSelesai, err := time.Parse("2006-01-02", datePart); err == nil {
				if todayTrunc.After(tSelesai) {
					continue
				}
			}
		}
		mentees = append(mentees, m)
	}

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
		"tugas":           hasil,
		"total_tugas":     len(tugasList),
		"tugas_aktif":     totalTugasAktif,
		"menunggu_review": totalMenungguGlobal,
		"perlu_revisi":    totalRevisiGlobal,
		"selesai_dinilai": totalDinilaiGlobal,
		"total_bimbingan": totalPesertaBimbingan,
	})
}

// ── 2. GET PESERTA BIMBINGAN UNTUK FORM PENUGASAN ─────────────────────────────
// [ROLE: MENTOR]
// GetPesertaBimbinganUntukTugas mengambil daftar peserta bimbingan aktif untuk opsi target penugasan spesifik.
// Endpoint: GET /api/manajemen/mentor/tugas/peserta-bimbingan
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

	utils.SuccessResponse(c, http.StatusOK, "Peserta bimbingan berhasil dimuat", hasil)
}

// ── 3. CREATE TUGAS MENTOR ────────────────────────────────────────────────────
// [ROLE: MENTOR]
// CreateTugasMentor membuat tugas baru atau kuis interaktif pilihan ganda, menetapkan tenggat waktu, dan mengirimkan notifikasi in-app ke peserta sasaran.
// Endpoint: POST /api/manajemen/mentor/tugas
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

	// Kirim notifikasi in-app & email ke peserta bimbingan yang bersangkutan
	go func(tugasID uint, judulTugas, targetP, targetJ string, specificIDs []uint, mID uint, tenggat *time.Time) {
		var recipientUserIDs []uint
		if targetP == "spesifik" && len(specificIDs) > 0 {
			recipientUserIDs = specificIDs
		} else {
			// Hanya kirim notifikasi & email ke peserta yang masih aktif magang (bukan alumni)
			hariIni := utils.TanggalHariIni()
			var mentees []models.PendaftaranMagang
			q := config.DB.
				Joins("JOIN user_manajemens u ON u.id = pendaftaran_magangs.akun_peserta_id").
				Where("pendaftaran_magangs.mentor_id = ? AND pendaftaran_magangs.status_pendaftaran = 'diterima' AND pendaftaran_magangs.akun_peserta_id IS NOT NULL", mID).
				Where("u.status_magang = 'aktif' AND u.status_akun = 'aktif'").
				Where("pendaftaran_magangs.tanggal_selesai IS NULL OR DATE(pendaftaran_magangs.tanggal_selesai) >= ?", hariIni)

			if targetJ != "" && targetJ != "semua" {
				q = q.Where("LOWER(pendaftaran_magangs.kategori_pendaftar) = ?", strings.ToLower(targetJ))
			}
			q.Select("pendaftaran_magangs.akun_peserta_id").Find(&mentees)
			for _, m := range mentees {
				if m.AkunPesertaID != nil {
					recipientUserIDs = append(recipientUserIDs, *m.AkunPesertaID)
				}
			}
		}

		deadlineStr := "Tidak ditentukan"
		if tenggat != nil {
			deadlineStr = tenggat.Format("02 January 2006 15:04 WIB")
		}

		var mentor models.UserManajemen
		config.DB.Select("id, nama").First(&mentor, mID)
		namaMentor := mentor.Nama
		if namaMentor == "" {
			namaMentor = "Mentor Pembimbing"
		}

		for _, pid := range recipientUserIDs {
			pCopy := pid
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pCopy,
				Tipe:         "tugas_baru",
				Prioritas:    "normal",
				Judul:        "Penugasan Magang Baru",
				Pesan:        fmt.Sprintf("Mentor telah menambahkan tugas baru: \"%s\". Silakan periksa instruksi penugasan.", judulTugas),
				RefTabel:     "tugas_magangs",
				RefID:        &tugasID,
				UrlTujuan:    "/peserta/pembelajaran/tugas",
			})

			var peserta models.UserManajemen
			if err := config.DB.Select("id, nama, email").First(&peserta, pid).Error; err == nil && peserta.Email != "" {
				bodyEmail := emailtemplates.TemplateTugasBaru(peserta.Nama, judulTugas, namaMentor, deadlineStr)
				_ = services.SendEmail(peserta.Email, "Penugasan Magang Baru: "+judulTugas, bodyEmail)
			}
		}
	}(tugasBaru.ID, tugasBaru.Judul, tugasBaru.TargetPeserta, tugasBaru.TargetJenjang, targetUserIDs, mentorID, tugasBaru.TenggatWaktu)

	utils.SuccessResponse(c, http.StatusCreated, "Tugas berhasil diterbitkan untuk peserta bimbingan", tugasBaru)
}

// ── 4. UPDATE TUGAS MENTOR ────────────────────────────────────────────────────
// [ROLE: MENTOR]
// UpdateTugasMentor memperbarui data penugasan magang/kuis seperti judul, deskripsi, tenggat waktu, file lampiran, atau butir soal kuis.
// Endpoint: PUT /api/manajemen/mentor/tugas/:id
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

	var targetUserIDs []uint
	if tugas.TargetPeserta == "spesifik" {
		pesertaIDsRaw := c.PostFormArray("peserta_ids[]")
		if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_ids") != "" {
			pesertaIDsRaw = strings.Split(c.PostForm("peserta_ids"), ",")
		}
		if len(pesertaIDsRaw) == 0 && c.PostForm("peserta_id") != "" {
			pesertaIDsRaw = []string{c.PostForm("peserta_id")}
		}

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

	// Kirim notifikasi in-app pembaruan tugas jika ada perubahan
	go func(tugasID uint, judulTugas, targetP, targetJ string, specificIDs []uint, mID uint) {
		var recipientUserIDs []uint
		if targetP == "spesifik" && len(specificIDs) > 0 {
			recipientUserIDs = specificIDs
		} else {
			var mentees []models.PendaftaranMagang
			q := config.DB.Where("mentor_id = ? AND status_pendaftaran = 'diterima' AND akun_peserta_id IS NOT NULL", mID)
			if targetJ != "" && targetJ != "semua" {
				q = q.Where("kategori_pendaftar = ?", targetJ)
			}
			q.Find(&mentees)
			for _, m := range mentees {
				if m.AkunPesertaID != nil {
					recipientUserIDs = append(recipientUserIDs, *m.AkunPesertaID)
				}
			}
		}

		for _, pid := range recipientUserIDs {
			pCopy := pid
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pCopy,
				Tipe:         "tugas_baru",
				Prioritas:    "normal",
				Judul:        "Pembaruan Tugas Magang",
				Pesan:        fmt.Sprintf("Mentor telah memperbarui tugas \"%s\". Silakan periksa perubahan instruksi atau tenggat waktu.", judulTugas),
				RefTabel:     "tugas_magangs",
				RefID:        &tugasID,
				UrlTujuan:    "/peserta/pembelajaran/tugas",
				Gabungkan:    true,
			})
		}
	}(tugas.ID, tugas.Judul, tugas.TargetPeserta, tugas.TargetJenjang, targetUserIDs, mentorID)

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil diperbarui", tugas)
}

// ── 5. DELETE TUGAS MENTOR ────────────────────────────────────────────────────
// [ROLE: MENTOR]
// DeleteTugasMentor menghapus tugas magang beserta seluruh pengumpulan dan file lampirannya dari sistem.
// Endpoint: DELETE /api/manajemen/mentor/tugas/:id
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

	// Hapus berkas fisik pengumpulan tugas peserta jika ada
	var pengumpulanList []models.PengumpulanTugas
	config.DB.Where("tugas_id = ?", tugas.ID).Find(&pengumpulanList)
	for _, p := range pengumpulanList {
		if p.FilePengumpulan != "" {
			cleanP := strings.TrimPrefix(strings.ReplaceAll(p.FilePengumpulan, "\\", "/"), "/")
			if strings.HasPrefix(cleanP, "uploads/") && !strings.Contains(cleanP, "..") {
				_ = os.Remove(cleanP)
			}
		}
	}

	// Hapus relasi many2many
	_ = config.DB.Model(&tugas).Association("PesertaAkses").Clear()

	// Hapus tugas (cascade akan menghapus pengumpulan tugas terkait)
	if err := config.DB.Delete(&tugas).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus tugas")
		return
	}

	// Bersihkan notifikasi terkait tugas ini
	config.DB.Where("ref_tabel = 'tugas_magangs' AND ref_id = ?", tugas.ID).Delete(&models.Notifikasi{})
	config.DB.Exec(`
		DELETE FROM notifikasis 
		WHERE ref_tabel = 'pengumpulan_tugas' 
		  AND ref_id NOT IN (SELECT id FROM pengumpulan_tugas)
	`)

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil dihapus", nil)
}

// ── 6. GET DETAIL PENGUMPULAN TUGAS OLEH PESERTA ──────────────────────────────
// [ROLE: MENTOR]
// GetPengumpulanTugasMentor mengambil rincian pengumpulan tugas atau hasil pengerjaan kuis dari seluruh peserta target pada satu tugas tertentu.
// Endpoint: GET /api/manajemen/mentor/tugas/:id/pengumpulan
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
			// Jika pengumpulan masih berstatus menunggu (sedang menunggu koreksi esai atau review ulang),
			// pastikan catatan mentor kosong agar catatan dari pengerjaan sebelumnya tidak muncul lagi.
			if sub.Status == "menunggu" {
				sub.CatatanMentor = ""
			}
			item.Pengumpulan = &sub
			item.StatusPengumpulan = sub.Status
		} else {
			// Jika peserta sudah selesai magang dan tidak mengumpulkan tugas ini, jangan tampilkan di daftar belum kumpul
			isSelesai := false
			if m.AkunPeserta != nil && (m.AkunPeserta.StatusMagang == "selesai" || m.AkunPeserta.StatusAkun != "aktif") {
				isSelesai = true
			}
			if m.TanggalSelesai != "" {
				datePart := strings.Split(m.TanggalSelesai, "T")[0]
				if tSelesai, err := time.Parse("2006-01-02", datePart); err == nil {
					if now.Truncate(24 * time.Hour).After(tSelesai) {
						isSelesai = true
					}
				}
			}
			if isSelesai {
				continue
			}

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
		"tugas":        tugas,
		"submissions":  hasilPeserta,
		"total_target": len(hasilPeserta),
		"total_kumpul": len(pengumpulanList),
	})
}

// ── 7. REVIEW / ACC PENGUMPULAN TUGAS OLEH MENTOR ─────────────────────────────
type ReviewTugasInput struct {
	Action        string   `json:"action" binding:"required"` // "acc" | "revisi" | "nilai_manual" | "nilai_kuis"
	Nilai         *float64 `json:"nilai"`
	CatatanMentor string   `json:"catatan_mentor"`
	JawabanKuis   string   `json:"jawaban_kuis"`
	StatusRemidi  string   `json:"status_remidi"` // "tuntas" | "perlu_remidi" | "tidak"
}

// [ROLE: MENTOR]
// ReviewPengumpulanTugasMentor memberikan nilai angka, catatan evaluasi, atau meminta revisi pengumpulan tugas peserta bimbingan.
// Endpoint: POST /api/manajemen/mentor/tugas/pengumpulan/:pengumpulan_id/review
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

	// Kirim notifikasi hasil evaluasi tugas ke peserta (in-app & email)
	go func(pid uint, jdl, act, ctt string, n *float64, qID uint) {
		var peserta models.UserManajemen
		_ = config.DB.Select("id, nama, email").First(&peserta, pid)

		if strings.ToLower(act) == "revisi" {
			pesanNotif := fmt.Sprintf("Mentor meminta revisi untuk tugas '%s'. Silakan periksa catatan evaluasi.", jdl)
			if ctt != "" {
				pesanNotif = fmt.Sprintf("Mentor meminta revisi tugas '%s': \"%s\"", jdl, ctt)
			}
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pid,
				Tipe:         "tugas_feedback",
				Prioritas:    "tinggi",
				Judul:        "Permintaan Revisi Tugas",
				Pesan:        pesanNotif,
				RefTabel:     "pengumpulan_tugas",
				RefID:        &qID,
				UrlTujuan:    "/peserta/pembelajaran/tugas",
			})

			if peserta.Email != "" {
				bodyEmail := emailtemplates.TemplateTugasRevisi(peserta.Nama, jdl, ctt)
				_ = services.SendEmail(peserta.Email, "Permintaan Revisi Tugas: "+jdl, bodyEmail)
			}
		} else {
			skor := 0.0
			if n != nil {
				skor = *n
			}
			pesanNotif := fmt.Sprintf("Tugas '%s' telah dinilai oleh mentor (Nilai: %.0f).", jdl, skor)
			if ctt != "" {
				pesanNotif += fmt.Sprintf(" Catatan: %s", ctt)
			}
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "peserta",
				TargetUserID: &pid,
				Tipe:         "tugas_nilai",
				Prioritas:    "normal",
				Judul:        "Tugas Selesai Dinilai",
				Pesan:        pesanNotif,
				RefTabel:     "pengumpulan_tugas",
				RefID:        &qID,
				UrlTujuan:    "/peserta/pembelajaran/tugas",
			})

			if peserta.Email != "" {
				skorStr := fmt.Sprintf("%.0f", skor)
				bodyEmail := emailtemplates.TemplateTugasDinilai(peserta.Nama, jdl, skorStr, ctt)
				_ = services.SendEmail(peserta.Email, "Tugas Telah Dinilai: "+jdl, bodyEmail)
			}
		}
	}(pengumpulan.PesertaID, pengumpulan.Tugas.Judul, req.Action, pengumpulan.CatatanMentor, pengumpulan.Nilai, pengumpulan.ID)

	// Tandai notifikasi mentor untuk pengumpulan ini sebagai sudah dibaca
	nowNotif := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'mentor' AND ref_tabel = 'pengumpulan_tugas' AND ref_id = ?", pengumpulan.ID).
		Update("dibaca_pada", nowNotif)

	pesan := "Tugas berhasil disetujui (ACC)"
	if strings.ToLower(req.Action) == "revisi" {
		pesan = "Permintaan revisi tugas berhasil dikirimkan ke peserta"
	}

	utils.SuccessResponse(c, http.StatusOK, pesan, pengumpulan)
}

// ── 8. SET NILAI 0 UNTUK PESERTA YANG TIDAK MENGUMPULKAN TUGAS ────────────────
type BeriNilaiNolInput struct {
	TugasID   uint   `json:"tugas_id" binding:"required"`
	PesertaID uint   `json:"peserta_id" binding:"required"`
	Catatan   string `json:"catatan"`
}

// [ROLE: MENTOR]
// SetNilaiNolTugasMentor menetapkan nilai 0 secara otomatis bagi peserta bimbingan yang melewati batas tenggat waktu dan tidak mengumpulkan tugas.
// Endpoint: POST /api/manajemen/mentor/tugas/nilai-nol
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

	go func(pid uint, jdl string, qID uint) {
		services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pid,
			Tipe:         "tugas_nilai",
			Prioritas:    "tinggi",
			Judul:        "Penilaian Tugas Magang",
			Pesan:        fmt.Sprintf("Tugas '%s' telah dinilai oleh mentor (Nilai: 0).", jdl),
			RefTabel:     "pengumpulan_tugas",
			RefID:        &qID,
			UrlTujuan:    "/peserta/pembelajaran/tugas",
		})
	}(req.PesertaID, tugas.Judul, pengumpulan.ID)

	// Tandai notifikasi mentor untuk pengumpulan ini sebagai sudah dibaca
	nowNotif := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'mentor' AND ref_tabel = 'pengumpulan_tugas' AND ref_id = ?", pengumpulan.ID).
		Update("dibaca_pada", nowNotif)

	utils.SuccessResponse(c, http.StatusOK, "Nilai 0 poin berhasil ditetapkan untuk peserta", pengumpulan)
}

// ==============================================================================
// ── BAGIAN PESERTA: LIHAT, KERJAKAN & KUMPULKAN TUGAS ─────────────────────────
// ==============================================================================

// ── 9. GET TUGAS MAGANG PESERTA ───────────────────────────────────────────────
// [ROLE: PESERTA]
// GetTugasPeserta mengambil daftar seluruh penugasan magang dan kuis yang ditugaskan mentor kepada peserta yang login, beserta status pengerjaannya.
// Endpoint: GET /api/manajemen/peserta/tugas
func GetTugasPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran)

	pastikanTugasBawaan(pendaftaran.MentorID)

	bidang := pendaftaran.PosisiBidang
	jenjang := strings.ToLower(pendaftaran.KategoriPendaftar) // "mahasiswa" atau "siswa"

	// Query tugas yang relevan untuk peserta ini
	var tugasList []models.TugasMagang
	q := config.DB.Model(&models.TugasMagang{}).Preload("Mentor")
	if pendaftaran.MentorID != nil {
		q = q.Where(
			"(mentor_id IS NULL OR mentor_id = ?) AND ("+
				"(target_peserta = 'semua_bimbingan' AND (target_jenjang = 'semua' OR target_jenjang = ? OR target_jenjang IS NULL OR target_jenjang = '')) OR "+
				"(target_peserta = 'mahasiswa' AND ? = 'mahasiswa') OR "+
				"(target_peserta = 'siswa' AND ? = 'siswa') OR "+
				"id IN (SELECT tugas_id FROM tugas_peserta_akses WHERE peserta_id = ?) OR "+
				"peserta_id = ? OR "+
				"(peserta_id IS NULL AND (target_peserta = '' OR target_peserta IS NULL))"+
				")",
			*pendaftaran.MentorID, jenjang, jenjang, jenjang, pesertaID, pesertaID,
		)
	} else if bidang != "" {
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
			// Jika status tugas masih menunggu koreksi/review, kosongkan catatan mentor agar tidak menampilkan catatan percobaan sebelumnya
			if p.Status == "menunggu" {
				p.CatatanMentor = ""
			}
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

		// Sanitasi kunci jawaban kuis jika belum selesai dinilai
		if t.TipeTugas == "kuis" && t.KuisData != "" {
			sudahSelesai := item.Pengumpulan != nil && item.Pengumpulan.Status == "dinilai"
			item.TugasMagang.KuisData = sanitizeKuisDataUntukPeserta(t.KuisData, sudahSelesai)
		}

		hasil = append(hasil, item)
	}

	rataNilai := 0.0
	if jumlahDinilai > 0 {
		rataNilai = totalNilai / float64(jumlahDinilai)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar tugas magang berhasil dimuat", gin.H{
		"statistik": gin.H{
			"total_tugas":      len(tugasList),
			"belum_dikerjakan": totalBelum,
			"menunggu_review":  totalMenunggu,
			"telah_dinilai":    totalSelesai,
			"rata_rata_nilai":  rataNilai,
		},
		"tugas": hasil,
	})
}

// ── 10. KUMPUL / SERAHKAN TUGAS BERKAS PESERTA ────────────────────────────────
// [ROLE: PESERTA]
// KumpulTugasPeserta mengumpulkan berkas tugas (PDF/ZIP/dokumen) dan/atau tautan eksternal (GitHub, Google Drive) beserta catatan pengantar peserta.
// Endpoint: POST /api/manajemen/peserta/tugas/:id/kumpul
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

	var pengumpulan models.PengumpulanTugas
	adaPengumpulan := config.DB.Where("tugas_id = ? AND peserta_id = ?", tugasID, pesertaID).First(&pengumpulan).Error == nil

	linkTugas, hasLink := c.GetPostForm("link_tugas")
	linkTugas = strings.TrimSpace(linkTugas)
	catatanPeserta, hasCatatan := c.GetPostForm("catatan_peserta")
	catatanPeserta = strings.TrimSpace(catatanPeserta)
	fileHeader, _ := c.FormFile("file_tugas")

	var filePath string
	if fileHeader != nil {
		path, errSave := simpanFileTugas(c, fileHeader, pesertaID, tugasID)
		if errSave != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, errSave.Error())
			return
		}
		filePath = path
	}

	// Tentukan status berkas, tautan, dan catatan efektif
	fileEfektif := filePath
	if fileEfektif == "" && adaPengumpulan {
		fileEfektif = pengumpulan.FilePengumpulan
	}

	linkEfektif := linkTugas
	if !hasLink && adaPengumpulan {
		linkEfektif = pengumpulan.LinkTugas
	}

	catatanEfektif := catatanPeserta
	if !hasCatatan && adaPengumpulan {
		catatanEfektif = pengumpulan.CatatanPeserta
	}

	// Validasi: minimal harus ada berkas ATAU tautan ATAU catatan penyelesaian
	if fileEfektif == "" && linkEfektif == "" && catatanEfektif == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Harap sertakan berkas tugas, tautan hasil karya, atau catatan penyelesaian.")
		return
	}

	now := time.Now()
	if adaPengumpulan {
		updates := map[string]interface{}{
			"waktu_kumpul":   now,
			"status":         "menunggu", // reset ke status menunggu review saat peserta memperbarui jawaban
			"catatan_mentor": "",         // reset catatan mentor lama saat peserta mengunggah perbaikan baru
			"dinilai_pada":   nil,
		}
		var oldFile string
		if filePath != "" {
			oldFile = pengumpulan.FilePengumpulan
			pengumpulan.FilePengumpulan = filePath
			updates["file_pengumpulan"] = filePath
		}
		if hasLink {
			pengumpulan.LinkTugas = linkTugas
			updates["link_tugas"] = linkTugas
		}
		if hasCatatan {
			pengumpulan.CatatanPeserta = catatanPeserta
			updates["catatan_peserta"] = catatanPeserta
		}
		pengumpulan.WaktuKumpul = now
		pengumpulan.Status = "menunggu"
		pengumpulan.CatatanMentor = ""
		pengumpulan.DinilaiPada = nil

		if err := config.DB.Model(&pengumpulan).Updates(updates).Error; err != nil {
			if filePath != "" {
				_ = os.Remove(filePath)
			}
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui pengumpulan tugas")
			return
		}

		// Hapus file tugas lama jika peserta mengunggah berkas pengganti yang baru
		if oldFile != "" && oldFile != filePath {
			cleanOld := strings.TrimPrefix(strings.ReplaceAll(oldFile, "\\", "/"), "/")
			if strings.HasPrefix(cleanOld, "uploads/") && !strings.Contains(cleanOld, "..") {
				_ = os.Remove(cleanOld)
			}
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
			if filePath != "" {
				_ = os.Remove(filePath)
			}
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengumpulkan tugas")
			return
		}
	}

	// Notifikasi in-app & email ke mentor jika ada
	if tugas.MentorID != nil {
		mentorID := *tugas.MentorID
		var userPeserta models.UserManajemen
		config.DB.First(&userPeserta, pesertaID)

		go func(mID uint, namaPeserta string, t models.TugasMagang, p models.PengumpulanTugas) {
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "mentor",
				TargetUserID: &mID,
				Tipe:         "tugas_dikumpulkan",
				Prioritas:    "normal",
				Judul:        "Tugas Magang Dikumpulkan",
				Pesan:        fmt.Sprintf("Peserta %s telah mengumpulkan tugas: %s", namaPeserta, t.Judul),
				RefTabel:     "pengumpulan_tugas",
				RefID:        &p.ID,
				UrlTujuan:    fmt.Sprintf("/mentor/tugas/review?tugas_id=%d", t.ID),
				Gabungkan:    false,
			})

			var mentor models.UserManajemen
			if err := config.DB.Select("id, nama, email").First(&mentor, mID).Error; err == nil && mentor.Email != "" {
				subject := fmt.Sprintf("Tugas Magang Dikumpulkan: %s (%s)", t.Judul, namaPeserta)
				body := emailtemplates.TemplateTugasDikumpulkanMentor(mentor.Nama, namaPeserta, t.Judul, p.CatatanPeserta, t.ID)
				_ = services.SendEmail(mentor.Email, subject, body)
			}
		}(mentorID, userPeserta.Nama, tugas, pengumpulan)
	}

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil dikumpulkan", pengumpulan)
}

// ==============================================================================
// ── STRUKTUR & HANDLER KUIS INTERAKTIF PESERTA ────────────────────────────────
// ==============================================================================

type KuisSoalOpsi struct {
	Key  string `json:"key"`
	Teks string `json:"teks"`
}

type KuisSoalItem struct {
	ID                string         `json:"id"`
	Pertanyaan        string         `json:"pertanyaan"`
	Tipe              string         `json:"tipe"` // "pilihan_ganda" | "pilihan_ganda_kompleks" | "esai"
	Poin              int            `json:"poin"`
	Gambar            string         `json:"gambar,omitempty"`
	Opsi              []KuisSoalOpsi `json:"opsi"`
	KunciJawaban      string         `json:"kunci_jawaban,omitempty"`
	Pembahasan        string         `json:"pembahasan,omitempty"`
	PetunjukPenilaian string         `json:"petunjuk_penilaian,omitempty"`
}

type KuisConfig struct {
	DurasiMenit         int            `json:"durasi_menit"`
	KKM                 int            `json:"kkm"`
	IzinkanRemidi       bool           `json:"izinkan_remidi"`
	MaksPercobaan       int            `json:"maks_percobaan"`
	AcakSoal            bool           `json:"acak_soal"`
	TampilkanPembahasan bool           `json:"tampilkan_pembahasan"`
	DaftarSoal          []KuisSoalItem `json:"daftar_soal"`
}

type KumpulKuisInput struct {
	Jawaban map[string]string `json:"jawaban"` // map id_soal -> jawaban (key opsi atau teks esai)
}

type DetailNilaiSoal struct {
	Tipe           string `json:"tipe"`
	PoinMaksimal   int    `json:"poin_maksimal"`
	PoinDiperoleh  int    `json:"poin_diperoleh"`
	Benar          bool   `json:"benar"`
	JawabanPeserta string `json:"jawaban_peserta"`
	KunciJawaban   string `json:"kunci_jawaban,omitempty"`
	Pembahasan     string `json:"pembahasan,omitempty"`
}

type PayloadJawabanKuis struct {
	JawabanPeserta   map[string]string          `json:"jawaban_peserta"`
	SkorPilihanGanda int                        `json:"skor_pilihan_ganda"`
	SkorEsai         int                        `json:"skor_esai"`
	TotalSkor        float64                    `json:"total_skor"`
	KKM              int                        `json:"kkm"`
	AdaEsai          bool                       `json:"ada_esai"`
	DetailPerSoal    map[string]DetailNilaiSoal `json:"detail_per_soal"`
}

// sanitizeKuisDataUntukPeserta menyembunyikan kunci jawaban dan pembahasan sebelum kuis selesai dievaluasi
func sanitizeKuisDataUntukPeserta(rawJSON string, sudahSelesai bool) string {
	var cfg KuisConfig
	if err := json.Unmarshal([]byte(rawJSON), &cfg); err != nil {
		return rawJSON
	}

	if !sudahSelesai {
		for i := range cfg.DaftarSoal {
			cfg.DaftarSoal[i].KunciJawaban = ""
			cfg.DaftarSoal[i].Pembahasan = ""
			cfg.DaftarSoal[i].PetunjukPenilaian = ""
		}
	}

	sanitized, err := json.Marshal(cfg)
	if err != nil {
		return rawJSON
	}
	return string(sanitized)
}

// ── 11. KERJAKAN & KUMPULKAN KUIS PESERTA ─────────────────────────────────────
// [ROLE: PESERTA]
// KumpulKuisPeserta mengirimkan jawaban kuis pilihan ganda peserta dan otomatis menghitung skor nilai kelulusan / tuntas remidi.
// Endpoint: POST /api/manajemen/peserta/tugas/:id/kumpul-kuis
func KumpulKuisPeserta(c *gin.Context) {
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

	if tugas.TipeTugas != "kuis" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Penugasan ini bukan berupa kuis interaktif")
		return
	}

	var req KumpulKuisInput
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format jawaban kuis tidak valid")
		return
	}

	if req.Jawaban == nil {
		req.Jawaban = make(map[string]string)
	}

	var cfg KuisConfig
	if err := json.Unmarshal([]byte(tugas.KuisData), &cfg); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses data konfigurasi soal kuis")
		return
	}

	var pengumpulan models.PengumpulanTugas
	adaPengumpulan := config.DB.Where("tugas_id = ? AND peserta_id = ?", tugasID, pesertaID).First(&pengumpulan).Error == nil

	percobaanKe := 1
	if adaPengumpulan {
		if !cfg.IzinkanRemidi {
			utils.ErrorResponse(c, http.StatusBadRequest, "Kuis ini tidak mengizinkan pengulangan (remidi)")
			return
		}
		if cfg.MaksPercobaan > 0 && pengumpulan.PercobaanKe >= cfg.MaksPercobaan {
			utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Batas maksimal pengerjaan (%d kali) telah tercapai", cfg.MaksPercobaan))
			return
		}
		percobaanKe = pengumpulan.PercobaanKe + 1
	}

	detailPerSoal := make(map[string]DetailNilaiSoal)
	totalPoinMC := 0
	totalPoinMaksimal := 0
	adaEsai := false

	for _, s := range cfg.DaftarSoal {
		totalPoinMaksimal += s.Poin
		ans := strings.TrimSpace(req.Jawaban[s.ID])

		if s.Tipe == "pilihan_ganda" || s.Tipe == "pilihan_ganda_kompleks" {
			isBenar := false
			if s.Tipe == "pilihan_ganda_kompleks" {
				kunciParts := strings.Split(s.KunciJawaban, ",")
				ansParts := strings.Split(ans, ",")
				for i := range kunciParts {
					kunciParts[i] = strings.ToUpper(strings.TrimSpace(kunciParts[i]))
				}
				for i := range ansParts {
					ansParts[i] = strings.ToUpper(strings.TrimSpace(ansParts[i]))
				}
				sort.Strings(kunciParts)
				sort.Strings(ansParts)
				isBenar = strings.Join(kunciParts, ",") == strings.Join(ansParts, ",") && len(kunciParts) > 0 && len(ansParts) > 0
			} else {
				isBenar = strings.EqualFold(ans, strings.TrimSpace(s.KunciJawaban))
			}

			poin := 0
			if isBenar {
				poin = s.Poin
				totalPoinMC += s.Poin
			}
			detailPerSoal[s.ID] = DetailNilaiSoal{
				Tipe:           s.Tipe,
				PoinMaksimal:   s.Poin,
				PoinDiperoleh:  poin,
				Benar:          isBenar,
				JawabanPeserta: ans,
				KunciJawaban:   s.KunciJawaban,
				Pembahasan:     s.Pembahasan,
			}
		} else {
			adaEsai = true
			detailPerSoal[s.ID] = DetailNilaiSoal{
				Tipe:           s.Tipe,
				PoinMaksimal:   s.Poin,
				PoinDiperoleh:  0,
				Benar:          false,
				JawabanPeserta: ans,
			}
		}
	}

	var nilaiAkhir float64 = float64(totalPoinMC)
	if totalPoinMaksimal > 0 && totalPoinMaksimal != 100 {
		nilaiAkhir = float64(int((float64(totalPoinMC) / float64(totalPoinMaksimal) * 100.0) + 0.5))
	}

	kkm := cfg.KKM
	if kkm <= 0 {
		kkm = 75
	}

	statusPengumpulan := "dinilai"
	statusRemidi := "tuntas"

	if adaEsai {
		statusPengumpulan = "menunggu" // menunggu koreksi esai oleh mentor
		statusRemidi = "menunggu_review"
	} else {
		if int(nilaiAkhir) < kkm {
			if cfg.IzinkanRemidi && (cfg.MaksPercobaan == 0 || percobaanKe < cfg.MaksPercobaan) {
				statusRemidi = "perlu_remidi"
			} else {
				statusRemidi = "tidak_tuntas"
			}
		} else {
			statusRemidi = "tuntas"
		}
	}

	payloadJawaban := PayloadJawabanKuis{
		JawabanPeserta:   req.Jawaban,
		SkorPilihanGanda: totalPoinMC,
		SkorEsai:         0,
		TotalSkor:        nilaiAkhir,
		KKM:              kkm,
		AdaEsai:          adaEsai,
		DetailPerSoal:    detailPerSoal,
	}

	jawabanBytes, _ := json.Marshal(payloadJawaban)
	now := time.Now()

	if adaPengumpulan {
		pengumpulan.JawabanKuis = string(jawabanBytes)
		pengumpulan.PercobaanKe = percobaanKe
		pengumpulan.StatusRemidi = statusRemidi
		pengumpulan.WaktuKumpul = now
		pengumpulan.Status = statusPengumpulan
		pengumpulan.CatatanMentor = "" // Reset catatan mentor dari pengerjaan sebelumnya saat mengulang kuis
		if !adaEsai {
			pengumpulan.Nilai = &nilaiAkhir
			pengumpulan.DinilaiPada = &now
		} else {
			pengumpulan.Nilai = nil
			pengumpulan.DinilaiPada = nil
		}

		if err := config.DB.Save(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui jawaban kuis")
			return
		}
	} else {
		var nilaiPtr *float64
		var dinilaiPadaPtr *time.Time
		if !adaEsai {
			nilaiPtr = &nilaiAkhir
			dinilaiPadaPtr = &now
		}

		pengumpulan = models.PengumpulanTugas{
			TugasID:      tugasID,
			PesertaID:    pesertaID,
			JawabanKuis:  string(jawabanBytes),
			PercobaanKe:  percobaanKe,
			StatusRemidi: statusRemidi,
			WaktuKumpul:  now,
			Status:       statusPengumpulan,
			Nilai:        nilaiPtr,
			DinilaiPada:  dinilaiPadaPtr,
		}

		if err := config.DB.Create(&pengumpulan).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan jawaban kuis")
			return
		}
	}

	// Notifikasi in-app & email ke mentor
	if tugas.MentorID != nil {
		mentorID := *tugas.MentorID
		var userPeserta models.UserManajemen
		config.DB.First(&userPeserta, pesertaID)

		pesanNotif := fmt.Sprintf("Peserta %s telah menyelesaikan kuis '%s' (Percobaan ke-%d) dengan skor %.0f", userPeserta.Nama, tugas.Judul, percobaanKe, nilaiAkhir)
		if adaEsai {
			pesanNotif = fmt.Sprintf("Peserta %s telah mengumpulkan kuis '%s' (ada soal isian/esai yang perlu dikoreksi)", userPeserta.Nama, tugas.Judul)
		}

		go func(mID uint, namaPeserta string, t models.TugasMagang, p models.PengumpulanTugas, msg string, skor float64) {
			services.KirimNotifikasi(services.NotifikasiInput{
				TargetRole:   "mentor",
				TargetUserID: &mID,
				Tipe:         "tugas_dikumpulkan",
				Prioritas:    "normal",
				Judul:        "Jawaban Kuis Dikumpulkan",
				Pesan:        msg,
				RefTabel:     "pengumpulan_tugas",
				RefID:        &p.ID,
				UrlTujuan:    fmt.Sprintf("/mentor/tugas/review?tugas_id=%d", t.ID),
				Gabungkan:    false,
			})

			var mentor models.UserManajemen
			if err := config.DB.Select("id, nama, email").First(&mentor, mID).Error; err == nil && mentor.Email != "" {
				subject := fmt.Sprintf("Kuis Magang Selesai: %s (%s)", t.Judul, namaPeserta)
				skorStr := fmt.Sprintf("%.0f", skor)
				body := emailtemplates.TemplateKuisSelesaiMentor(mentor.Nama, namaPeserta, t.Judul, skorStr, t.ID)
				_ = services.SendEmail(mentor.Email, subject, body)
			}
		}(mentorID, userPeserta.Nama, tugas, pengumpulan, pesanNotif, nilaiAkhir)
	}

	utils.SuccessResponse(c, http.StatusOK, "Jawaban kuis berhasil dikumpulkan", gin.H{
		"pengumpulan":    pengumpulan,
		"hasil_evaluasi": payloadJawaban,
		"status_remidi":  statusRemidi,
		"nilai_akhir":    nilaiAkhir,
		"kkm":            kkm,
		"percobaan_ke":   percobaanKe,
	})
}
