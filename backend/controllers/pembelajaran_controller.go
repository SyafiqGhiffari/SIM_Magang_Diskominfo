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
			"waktu_kumpul": now,
			"status":       "menunggu", // reset ke status menunggu review saat peserta memperbarui jawaban
		}
		if filePath != "" {
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

		if err := config.DB.Model(&pengumpulan).Updates(updates).Error; err != nil {
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
			UrlTujuan:    fmt.Sprintf("/mentor/tugas/review?tugas_id=%d", tugas.ID),
			Gabungkan:    false,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Tugas berhasil dikumpulkan", pengumpulan)
}

// ── 4. STRUKTUR & HANDLER KUIS PESERTA ────────────────────────────────────────

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

	// Notifikasi ke mentor
	if tugas.MentorID != nil {
		mentorID := *tugas.MentorID
		var userPeserta models.UserManajemen
		config.DB.First(&userPeserta, pesertaID)

		pesanNotif := fmt.Sprintf("Peserta %s telah menyelesaikan kuis '%s' (Percobaan ke-%d) dengan skor %.0f", userPeserta.Nama, tugas.Judul, percobaanKe, nilaiAkhir)
		if adaEsai {
			pesanNotif = fmt.Sprintf("Peserta %s telah mengumpulkan kuis '%s' (ada soal isian/esai yang perlu dikoreksi)", userPeserta.Nama, tugas.Judul)
		}

		go services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "mentor",
			TargetUserID: &mentorID,
			Tipe:         "tugas_dikumpulkan",
			Prioritas:    "normal",
			Judul:        "Jawaban Kuis Dikumpulkan",
			Pesan:        pesanNotif,
			RefTabel:     "pengumpulan_tugas",
			RefID:        &pengumpulan.ID,
			UrlTujuan:    fmt.Sprintf("/mentor/tugas/review?tugas_id=%d", tugas.ID),
			Gabungkan:    false,
		})
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
